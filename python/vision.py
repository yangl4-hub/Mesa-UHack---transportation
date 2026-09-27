"""Local, unvalidated occupancy baseline. Calibrated spaces are required.
python python/vision.py train --output python/model.json
python python/vision.py analyze --lot N --model python/model.json
python python/vision.py serve --port 8000
"""
import argparse
import json
from pathlib import Path
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import numpy as np
import cv2
ROOT = Path(__file__).resolve().parents[1]

def features(image, box):
    h, w = image.shape[:2]
    x1, y1 = max(0, int(box['x']*w)), max(0, int(box['y']*h))
    x2, y2 = min(w, int((box['x']+box['w'])*w)), min(h, int((box['y']+box['h'])*h))
    crop = image[y1:y2, x1:x2]
    if crop.size == 0: raise ValueError('Empty crop; check the calibration coordinates.')
    p = cv2.resize(crop, (16,16), interpolation=cv2.INTER_LINEAR).astype(float)/255
    gray = p.mean(axis=2)
    return [float(gray.mean()),float(gray.std()),float((p.max(axis=2)-p.min(axis=2)).mean()),float((gray>.7).mean()),float((gray<.23).mean()),float(np.abs(np.diff(gray,axis=1)).mean())]

def train(annotation_paths=()):
    seeds = json.loads((ROOT/'lib/seeds.json').read_text())
    images = {}
    def sample(lot, box, status):
        if lot not in 'EFGMNR' or len(lot)!=1: raise ValueError('Unknown lot')
        if lot not in images: images[lot] = cv2.imread(str(ROOT/'public/lots'/f'{lot}.png'))
        if images[lot] is None: raise ValueError('Missing image')
        return {'features':features(images[lot],box),'status':status}
    samples = [sample(s['lot'],s,s['status']) for s in seeds]
    for path in annotation_paths:
        doc=json.loads(Path(path).read_text())
        for s in doc['spots']:
            if s.get('label') in ('open','occupied'): samples.append(sample(doc['lot'],s,s['label']))
    return {'version':1,'method':'5-neighbor visual baseline','samples':samples,'note':'No held-out accuracy measured. Does not detect stall geometry.'}

def classify(values, samples):
    x=np.array([s['features'] for s in samples],dtype=float)
    values=np.array(values,dtype=float)
    if x.ndim!=2 or x.shape[1]!=6 or values.shape!=(6,) or not np.isfinite(x).all() or not np.isfinite(values).all(): raise ValueError('Expected six finite visual features')
    scale=np.maximum(.035,x.std(axis=0))
    distances=np.sqrt((((x-values)/scale)**2).sum(axis=1))
    neighbors=np.argsort(distances)[:5]
    weights=1/(distances[neighbors]+.12)
    occupied=float(sum(weights[i] for i,j in enumerate(neighbors) if samples[j]['status']=='occupied')/weights.sum())
    score=max(occupied,1-occupied)
    return {'status':'unknown' if score<.72 else ('occupied' if occupied>.5 else 'open'),'score':score}

def analyze_lot(lot_id,model,annotation=None):
    lots=json.loads((ROOT/'lib/lots.json').read_text())
    lot=next(l for l in lots if l['id']==lot_id)
    if annotation: lot['spots']=json.loads(Path(annotation).read_text())['spots']
    image=cv2.imread(str(ROOT/'public/lots'/f'{lot_id}.png'))
    results=[{**s,**classify(features(image,s),model['samples']),**({'status':s['label'],'score':1} if s.get('label') else {})} for s in lot['spots']]
    return {**lot,'spots':results,'source':'image estimate','updatedAt':datetime.now(timezone.utc).isoformat(),'counts':{'total':len(results),**{status:sum(s['status']==status for s in results) for status in ['open','occupied','unknown']}}}

class Handler(BaseHTTPRequestHandler):
    def send(self,status,body):
        raw=json.dumps(body).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_POST(self):
        if self.path!='/api/analyze': return self.send(404,{'error':'Unknown endpoint'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=2_000_000: return self.send(413,{'error':'Request too large'})
            body=json.loads(self.rfile.read(length));samples=body['samples'];spots=body['spots']
            if not 4<=len(samples)<=2000 or not 1<=len(spots)<=1000: raise ValueError('Invalid sample or space count')
            if not {'open','occupied'}<={s['status'] for s in samples}: raise ValueError('Need examples of both classes')
            if any(s['status'] not in ('open','occupied') for s in samples): raise ValueError('Invalid label')
            result=[{'id':s['id'],**classify(s['features'],samples)} for s in spots]
            self.send(200,{'spots':result,'model':'Python 5-neighbor visual baseline','updatedAt':datetime.now(timezone.utc).isoformat()})
        except (ValueError,KeyError,TypeError,IndexError): self.send(400,{'error':'Invalid analysis request'})
    def do_GET(self):
        if self.path=='/health': self.send(200,{'ok':True,'model':'unvalidated visual baseline'})
        else: self.send(404,{'error':'Unknown endpoint'})

if __name__=='__main__':
    parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='cmd',required=True)
    t=sub.add_parser('train');t.add_argument('--annotations',nargs='*',default=[]);t.add_argument('--output',default='python/model.json')
    a=sub.add_parser('analyze');a.add_argument('--lot',choices=list('EFGMNR'),required=True);a.add_argument('--model',default='python/model.json');a.add_argument('--annotations');a.add_argument('--output')
    s=sub.add_parser('serve');s.add_argument('--port',type=int,default=8000)
    args=parser.parse_args()
    if args.cmd=='train':
        model=train(args.annotations);Path(args.output).write_text(json.dumps(model,indent=2));print(f"Saved {len(model['samples'])} labeled examples to {args.output}; this is not an accuracy evaluation.")
    elif args.cmd=='analyze':
        result=analyze_lot(args.lot,json.loads(Path(args.model).read_text()),args.annotations);data=json.dumps(result,indent=2)
        if args.output: Path(args.output).write_text(data)
        else: print(data)
    else:
        print(f'Vision API listening on http://127.0.0.1:{args.port}',flush=True);ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()

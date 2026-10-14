import json,re,pathlib,urllib.request,hashlib,concurrent.futures
from PIL import Image
root=pathlib.Path('/workspace/scratch/90d9c6511385/relay-ledger');target=root/'deliverables/uploaded-gallery';target.mkdir(exist_ok=True)
def pixel_hash(p):
 im=Image.open(p).convert('RGB');return (im.size,hashlib.sha256(im.tobytes()).hexdigest())
source={pixel_hash(p):p.name for p in (root/'deliverables/devpost-gallery').glob('*.png')}
links={int(re.search(r'screenshot (\d+)',x['label'])[1]):x['href']for x in json.load(open('/workspace/scratch/relay-ledger-upload/uploaded-gallery.json'))}
def download(item):
 i,url=item;p=target/f'{i:02d}.png';p.write_bytes(urllib.request.urlopen(url,timeout=30).read());key=pixel_hash(p)
 if key not in source:raise ValueError(f'Uploaded image {i} pixels differ from every source; review needed')
 return {'index':i-1,'source':source[key],'url':url,'verified':'decoded RGB pixel hash matches original'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:records=sorted(pool.map(download,links.items()),key=lambda x:x['index'])
captions={x['file']:x['caption']for x in json.load(open(root/'deliverables/gallery-captions.json'))}
for r in records:r['caption']=captions[r['source']]
(root/'docs/gallery-upload-verification.json').write_text(json.dumps(records,indent=2));pathlib.Path('/workspace/scratch/relay-ledger-upload/caption-order.json').write_text(json.dumps(records));print(json.dumps([{'index':x['index'],'source':x['source']}for x in records],indent=2))

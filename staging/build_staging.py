"""Build an HTTPS-hostable candidate using ONLY owner-provided non-production endpoints."""
import argparse,json,re,shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=argparse.ArgumentParser();p.add_argument('--config',required=True);p.add_argument('--out',required=True);a=p.parse_args()
c=json.loads(Path(a.config).read_text());f=c['firebase'];u=c['sheetsWebAppUrl']
prod_db='oj-stock-a6af4-default-rtdb';prod_deployments=['AKfycbwe-h24CMCM1c92oIrlh_mOaMr6NJFQ8iaMhAJ_Rr958QAe4qJjoEjj-5ERufIIQr6g','AKfycbzwraa62HFHFyiad9c43xCwMHE8LKi6FZVT6i_v_Ta05AwsH8SXXS9rWU429fdB7p6u']
if not str(f.get('databaseURL','')).startswith('https://') or prod_db in f['databaseURL'] or f.get('projectId')=='oj-stock-a6af4':raise SystemExit('REFUSED: missing HTTPS Firebase test endpoint or production project')
if not u.startswith('https://script.google.com/macros/s/') or not u.endswith('/exec') or any(x in u for x in prod_deployments):raise SystemExit('REFUSED: missing test Apps Script deployment or production endpoint')
s=(root/'index.html').read_text();s=re.sub(r'const firebaseConfig = \{.*?\n        \};','const firebaseConfig = '+json.dumps(f,ensure_ascii=False)+';',s,flags=re.S)
s=re.sub(r'const WEB_APP_URL = "[^"]+";', 'const WEB_APP_URL = '+json.dumps(u)+';',s)
s=s.replace('<body','<body data-environment="staging"',1).replace('<header','<div style="background:#7f1d1d;color:white;text-align:center;padding:5px">STAGING · SYNTHETIC DATA ONLY</div><header',1)
out=Path(a.out).resolve()
if out==root or root in out.parents and out.name in ['backend','tests','evidence']:raise SystemExit('REFUSED: unsafe output directory')
out.mkdir(parents=True,exist_ok=True);(out/'index.html').write_text(s)
for name in ['count-submit.js','count-state.js']:shutil.copyfile(root/name,out/name)
print(out)

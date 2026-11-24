import pathlib,sys,json
R=pathlib.Path(__file__).parent;sys.path.insert(0,str(R/'font-build-tools'))
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import WOFF2FlavorData
from fontTools import subset
import brotli
original=brotli.compress
def compress(data,**kwargs):return original(data,**dict(kwargs,quality=9))
brotli.compress=compress
def ranges(codes):
 rows=[]
 for cp in sorted(codes):
  if rows and cp==rows[-1][1]+1:rows[-1][1]=cp
  else:rows.append([cp,cp])
 return ','.join('U+%X'%a+('-%X'%b if a!=b else '') for a,b in rows)
out=R/'assets/ukai-web';out.mkdir(exist_ok=True)
source=R/'assets/ukai.ttc';all_codes=set(TTFont(source,fontNumber=0).getBestCmap())
ui=''.join((R/p).read_text('utf8') for p in ['index.template.html','dashboard.js','supplements.js'])
course=''.join((R/p).read_text('utf8') for p in ['data.json','supplements.json'])
base={cp for cp in all_codes if cp<=0x24f or 0x300<=cp<=0x36f or 0x1e00<=cp<=0x1eff or 0x2000<=cp<=0x206f}|({ord(c) for c in ui}&all_codes)
learning=({ord(c) for c in course}&all_codes)-base;rows=[];union=set()
notice='Web edition prepared 2026-11-24 for luyentuvung-hsk1to6: AR PL UKai CN face extracted, split by Unicode range, hinting removed, converted to WOFF2. Glyph outlines are unchanged. Licensed under ARPHIC PUBLIC LICENSE; modifications freely available in the public application repository.'
for group,codes in [('ui',base),('course',learning),('extended',all_codes-base-learning)]:
 f=TTFont(source,fontNumber=0);options=subset.Options();options.hinting=False;options.layout_features=['*'];options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*']
 sub=subset.Subsetter(options=options);sub.populate(unicodes=codes);sub.subset(f)
 for platform,encoding,lang in [(3,1,0x409),(1,0,0)]:
  old=f['name'].getDebugName(10) or '';f['name'].setName(notice+'\n'+old,10,platform,encoding,lang)
 f.flavor='woff2';f.flavorData=WOFF2FlavorData(transformedTables=set());name='UKai-'+group+'.woff2';f.save(out/name)
 actual=set(TTFont(out/name).getBestCmap());assert actual==codes;assert not union&actual;union|=actual
 row={'file':name,'weight':'100 900','group':group,'bytes':(out/name).stat().st_size,'characters':len(codes),'unicodeRange':ranges(codes)};rows.append(row);print(group,row['bytes'],len(codes),flush=True)
assert union==all_codes
(out/'manifest.json').write_text(json.dumps({'family':'HSK UKai','notice':notice,'fonts':rows},ensure_ascii=False),'utf8')
(out/'MODIFICATIONS.txt').write_text(notice,'utf8')

import urllib.request, urllib.error
base="https://audi-mediacenter.pl"
for endpoint in ["/pobierz.php?id_typu=3&id_materialu=48075","/data/filmy/48075/o/7405893_content_1280x720.mp4"]:
 for method in ["HEAD"]:
  req=urllib.request.Request(base+endpoint,method=method,headers={"User-Agent":"Mozilla/5.0","Referer":base+"/film,48075,footage:-audi-rs-6-avant-performance-mythos-black-metallic-.html"})
  try:
   with urllib.request.urlopen(req,timeout=25) as r:
    print(method,endpoint,"STATUS",r.status,"TYPE",r.headers.get("Content-Type"),"SIZE",r.headers.get("Content-Length"),"DISPOSITION",r.headers.get("Content-Disposition"),"FINAL_URL",r.geturl())
  except Exception as e:print("ERROR",endpoint,repr(e)[:350])

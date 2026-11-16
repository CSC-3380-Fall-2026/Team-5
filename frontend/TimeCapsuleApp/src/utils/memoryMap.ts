export type MemoryLocation = {
  latitude: number;
  longitude: number;
  locationName?: string;
};
export type MapMemory = MemoryLocation & {
  id: string;
  capsuleId: string;
  capsuleName: string;
  opensAt: string;
  text: string;
  photoUri: string;
};
export function validCoordinates(value: unknown): value is MemoryLocation {
  if (!value || typeof value !== 'object') return false;
  const point = value as MemoryLocation;
  return (
    Number.isFinite(point.latitude) &&
    Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.longitude) <= 180
  );
}
// Keep user content out of HTML parsing and executable markup.
function scriptJSON(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
export function buildMemoryMapHTML(
  memories: MapMemory[],
  picking = false,
  location?: MemoryLocation | null,
) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#F8F0E3}body{font-family:sans-serif}.photo{width:180px;max-height:130px;object-fit:cover;border-radius:8px}button{background:#735641;color:white;border:0;border-radius:7px;padding:12px;margin-top:8px;display:block}p{max-width:210px;overflow-wrap:anywhere}#error{position:absolute;top:8px;left:8px;z-index:1000;background:#fff9f0;padding:8px;max-width:80%;border-radius:8px}</style>
</head><body><div id="map"></div><div id="error" hidden></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const memories=${scriptJSON(memories)},picking=${picking},initial=${scriptJSON(
    location ?? null,
  )};
function send(value){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(value));}
function error(text){const node=document.getElementById('error');node.hidden=false;node.textContent=text;}
if(typeof L==='undefined'){error('Map could not load. Check your connection and retry.');send({type:'error'});}
else {
 const map=L.map('map').setView(initial?[initial.latitude,initial.longitude]:[30.4515,-91.1871],initial?15:12);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map).on('tileerror',()=>error('Map tiles are unavailable. Check your connection.'));
 let draft=initial?L.marker([initial.latitude,initial.longitude],{draggable:true}).addTo(map):null;
 function choose(lat,lon){if(lon>180||lon< -180)lon=((lon+180)%360+360)%360-180;if(lat>90||lat< -90)return;
  if(draft)draft.setLatLng([lat,lon]);else{draft=L.marker([lat,lon],{draggable:true}).addTo(map);wireDrag();}
  send({type:'location',latitude:lat,longitude:lon});}
 function wireDrag(){if(draft)draft.on('dragend',()=>{const p=draft.getLatLng();choose(p.lat,p.lng);});}wireDrag();
 if(picking)map.on('click',e=>choose(e.latlng.lat,e.latlng.lng));
 // Group shared coordinates so memories at the same place remain accessible.
 const groups=new Map();memories.forEach(m=>{const key=m.latitude+','+m.longitude;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);});
 groups.forEach(group=>{const first=group[0],card=document.createElement('div');
  group.forEach(m=>{const section=document.createElement('section');
   const name=document.createElement('strong');name.textContent=m.locationName||m.capsuleName;section.appendChild(name);
   if(new RegExp('^data:image/(jpeg|png|webp|gif);base64,','i').test(m.photoUri)||m.photoUri.startsWith('https://')){const img=document.createElement('img');img.className='photo';img.src=m.photoUri;img.alt='Memory photo';section.appendChild(img);}
   const p=document.createElement('p');p.textContent=m.text;section.appendChild(p);
   const b=document.createElement('button');b.textContent='Open memory in '+m.capsuleName;b.onclick=()=>send({type:'open',id:m.id});section.appendChild(b);card.appendChild(section);
  });L.marker([first.latitude,first.longitude]).addTo(map).bindPopup(card,{maxHeight:280});
 });
 if(memories.length&&!picking)map.fitBounds(memories.map(m=>[m.latitude,m.longitude]),{padding:[28,28],maxZoom:15});
}
</script></body></html>`;
}

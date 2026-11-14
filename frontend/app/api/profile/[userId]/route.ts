import {NextRequest,NextResponse} from 'next/server';
const base=process.env.BACKEND_URL || 'http://localhost:8080';
async function proxy(req:NextRequest,id:string,method:'GET'|'PUT'){
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Invalid user ID'},{status:400});
 try{const response=await fetch(`${base}/api/profile/${id}`,{method,headers:method==='PUT'?{'Content-Type':'application/json'}:{},body:method==='PUT'?await req.text():undefined,cache:'no-store'});
 const body=await response.text();return new NextResponse(body,{status:response.status,headers:{'Content-Type':response.headers.get('content-type')||'application/json'}});
 }catch{return NextResponse.json({error:'Backend unavailable. Start Spring Boot and MySQL.'},{status:502});}
}
export async function GET(req:NextRequest,{params}:{params:{userId:string}}){return proxy(req,params.userId,'GET')}
export async function PUT(req:NextRequest,{params}:{params:{userId:string}}){return proxy(req,params.userId,'PUT')}

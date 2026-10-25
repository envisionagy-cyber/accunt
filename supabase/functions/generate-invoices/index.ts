import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
const env=(k:string)=>Deno.env.get(k)||'';
const out=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{...corsHeaders,'Content-Type':'application/json'}});
function keys(){let pub=env('SUPABASE_ANON_KEY')||env('SUPABASE_PUBLISHABLE_KEY');if(!pub){try{pub=JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS')).default||''}catch{}}let priv=env('SUPABASE_SERVICE_ROLE_KEY');if(!priv){try{priv=JSON.parse(env('SUPABASE_SECRET_KEYS')).default||''}catch{}}return {pub,priv,url:env('SUPABASE_URL')}}
function shiftMonth(date:string,n:number){const d=new Date(date+'T00:00:00Z'),day=d.getUTCDate(),f=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1)),last=new Date(Date.UTC(f.getUTCFullYear(),f.getUTCMonth()+1,0)).getUTCDate();f.setUTCDate(Math.min(day,last));return f.toISOString().slice(0,10)}
function monthsBetween(a:string,b:string){const x=new Date(a+'T00:00:00Z'),y=new Date(b+'T00:00:00Z');return Math.max(0,(y.getUTCFullYear()-x.getUTCFullYear())*12+y.getUTCMonth()-x.getUTCMonth()+1)}
function addDays(s:string,n:number){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return out({error:'POST required'},405);
 try{
  const {url,pub,priv}=keys();if(!url||!priv)throw new Error('Supabase server secrets are not configured');
  const admin=createClient(url,priv,{auth:{persistSession:false}});
  const auth=req.headers.get('Authorization')||'',secret=env('CRON_SECRET');let permitted=!!secret&&auth===`Bearer ${secret}`;
  if(!permitted){const token=auth.replace(/^Bearer\s+/i,'');if(!token||!pub)return out({error:'Admin login required'},401);const u=createClient(url,pub,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});const {data:{user},error}=await u.auth.getUser(token);if(error||!user)return out({error:'Invalid session'},401);const {data:p}=await admin.from('profiles').select('role').eq('id',user.id).maybeSingle();if(p?.role!=='admin')return out({error:'Admin only'},403);permitted=true}
  const {data:projects,error}=await admin.from('projects').select('*, clients(name)').eq('auto_invoice',true).in('status',['active','completed']);if(error)throw error;
  const now=new Date().toISOString().slice(0,10);let created=0,skipped=0;const errors:string[]=[];
  for(const p of projects||[]){try{if(!p.contract_start||!p.contract_end||p.contract_end<p.contract_start)continue;const periods=monthsBetween(p.contract_start,p.contract_end);for(let n=0;n<periods;n++){let issue=shiftMonth(p.contract_start,n);if(issue>p.contract_end)issue=p.contract_end;if(issue>now)break;const {data:exists,error:ce}=await admin.from('invoices').select('id').eq('project_id',p.id).eq('billing_period',issue).maybeSingle();if(ce)throw ce;if(exists){skipped++;continue}
   const {data:settings,error:se}=await admin.from('company_settings').select('invoice_prefix,next_invoice_number').eq('id',1).single();if(se)throw se;const seq=Number(settings.next_invoice_number||1),number=(settings.invoice_prefix||'ENV-')+String(seq).padStart(4,'0');const subtotal=Number(p.monthly_fee||0),rate=Number(p.tax_rate||0),tax=Math.round(subtotal*rate)/100,total=Math.round((subtotal+subtotal*rate/100)*100)/100;
   const row={invoice_number:number,client_id:p.client_id,client_name_snapshot:p.clients?.name||'Client',project_id:p.id,billing_period:issue,issue_date:issue,due_date:addDays(issue,Number(p.payment_due_days||0)),status:'issued',items:[{description:`${p.name} — ${issue.slice(0,7)}`,quantity:1,rate:subtotal}],subtotal,tax_rate:rate,tax_amount:tax,total,notes:`Auto-generated monthly invoice. Contract ${p.contract_start} to ${p.contract_end}.`};
   const {error:ie}=await admin.from('invoices').insert(row);if(ie){if(ie.code==='23505'){skipped++;continue}throw ie}created++;const {error:ue}=await admin.from('company_settings').update({next_invoice_number:seq+1}).eq('id',1);if(ue)throw ue;
  }if(p.contract_end<now&&p.status!=='completed')await admin.from('projects').update({status:'completed'}).eq('id',p.id);
  }catch(e){errors.push(`${p.name}: ${String(e)}`)}}
  return out({ok:errors.length===0,created,skipped,errors});
 }catch(e){return out({error:String(e)},500)}
});

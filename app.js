document.addEventListener("DOMContentLoaded",()=>{
    // Utilidades
    const $=(s,c=document)=>c.querySelector(s);
    const $$=(s,c=document)=>[...c.querySelectorAll(s)];
    const F=new Intl.NumberFormat("es-CO");
    const fmt=p=>p>0?"$"+F.format(p):"";
    
    // Sanitización básica
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    
    // Split titulo:descripcion
    const sp=t=>{
        const i=(t=t||"").indexOf(":");
        return i<0?[t.trim(),""]:[t.slice(0,i).trim(),t.slice(i+1).trim()]
    };

    // Renderizado (Mantiene estructura Visual EXACTA)
    const rend=d=>d.map(p=>p.id==="hoja_cierre"?pgC(p):pgM(p)).join("");
    
    const pgM=d=>`<div class="stage menu-page">
        <img src="assets/rama.png" class="decor decor-tl"><img src="assets/rama.png" class="decor decor-br">
        <div class="header"><div class="sub">Restaurante</div><h1 class="brand">EL RECREO</h1><div class="sub" style="border-top:1px solid #fff;display:inline-block;padding-top:4px">MENÚ</div></div>
        ${grp(d.g1,"g-izq")}${grp(d.g2,"g-der")}${grp(d.g3,"g-izq")}
    </div>`;

    const grp=(g,cls)=>`<div class="grupo ${cls}">
        <div class="encabezado-seccion">${cls==="g-izq"?pill(g.titulo)+line():line()+pill(g.titulo)}</div>
        <div class="cuerpo-grupo">${cls==="g-izq"?list(g.items)+img(g.img):img(g.img)+list(g.items)}</div>
    </div>`;

    const pill=t=>`<div class="pill">${t}</div>`;
    const line=()=>`<div class="line"></div>`;
    const img=src=>`<div class="circle-container"><img src="${src}" onerror="this.style.backgroundColor='#222'"></div>`;
    
    const list=items=>`<div class="list">${items.map(it=>itm(it)).join("")}</div>`;

    const itm=i=>{
        const hasClick=!!(i.desc||[i.srcimg1,i.srcimg2,i.srcimg3,i.srcimg4].some(x=>x&&x.trim()));
        const [tit,desc]=sp(i.item);
        const cl=i.precio===0?" opt":"";
        const clickable=hasClick?" is-clickable js-item-title":"";
        // Guardamos data en el botón para evitar búsquedas complejas después
        const dataAtt=hasClick?` data-json='${JSON.stringify(i).replace(/'/g,"&#39;")}'`:"";
        
        return `<div class="item${cl}">
            <span>
                <button class="item-title${clickable}"${dataAtt}>${esc(tit)}</button>
                ${desc?": "+esc(desc):""}
            </span>
            <span class="price">${fmt(i.precio)}</span>
        </div>`;
    };

    const pgC=d=>`<div class="stage closing-page">
        <img src="assets/rama.png" class="decor decor-tl"><img src="assets/rama.png" class="decor decor-br" style="bottom:-10%; right:-10%;">
        <div class="header closing-header"><div class="sub">Restaurante</div><h1 class="brand">EL RECREO</h1></div>
        <div class="closing-content">
            <div class="logo-container"><img src="${d.logo_img}" onerror="this.style.display='none'"></div>
            <div class="fake-button">${d.boton_texto}</div>
            <div class="contacts-section">${d.contactos.map(c=>`<div class="contact-block"><div class="contact-role">${c.cargo}: ${c.nombre}</div><div class="contact-phone">Celular: ${c.celular}</div></div>`).join("")}</div>
            <div class="address-section"><div>${d.direccion.linea1}</div><div class="address-highlight">${d.direccion.linea2}</div></div>
            <div class="delivery-text">${d.domicilio_texto}</div>
            <div class="thank-you-text">${d.agradecimiento_texto}</div>
        </div>
    </div>`;

    // Lógica del Modal
    const dlg=$("#item-dialog"),tit=$("#m-title"),desc=$("#m-desc"),tr=$("#m-track"),car=$("#m-carousel"),pv=$(".prev",dlg),nx=$(".next",dlg);
    let imgs=[],idx=0;

    const uCar=()=>{
        imgs.forEach((m,i)=>m.classList.toggle("active",i===idx));
        pv.disabled=idx===0;
        nx.disabled=idx===imgs.length-1;
    };

    // Event Delegation (Optimización de memoria)
    $("#app-container").addEventListener("click",e=>{
        const b=e.target.closest(".js-item-title");
        if(!b)return;
        e.preventDefault(); // Evita submit si hubiera form
        
        const i=JSON.parse(b.dataset.json);
        const [t]=sp(i.item);
        
        tit.textContent=t;
        desc.textContent=i.desc||"";
        
        const src=[i.srcimg1,i.srcimg2,i.srcimg3,i.srcimg4].filter(x=>x&&x.trim());
        if(src.length){
            tr.innerHTML=src.map((s,j)=>`<img class="carousel-image${j===0?" active":""}" src="${s}">`).join("");
            imgs=$$(".carousel-image",tr);
            idx=0;
            car.style.display="flex";
            uCar();
        }else{
            car.style.display="none";
        }
        dlg.showModal();
    });

    pv.onclick=()=>{if(idx>0){idx--;uCar()}};
    nx.onclick=()=>{if(idx<imgs.length-1){idx++;uCar()}};

    // Cargar Datos
    fetch("menu.json").then(r=>r.json()).then(d=>{
        $("#app-container").innerHTML=rend(d);
    }).catch(e=>console.error(e));
});

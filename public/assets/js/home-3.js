var MNAV={cur:"home",home:"#",shop:"/shop",course:"/khoa-hoc",services:"/dich-vu-setup",zalo:"https://zalo.me/dappercombat",fb:"https://facebook.com/dappercombat"};


/* ===== MNAV V3: menu mobile + nhãn menu thống nhất cho Home / Shop / Course (cấu hình MNAV do build chèn) ===== */
(function(){
  if(typeof MNAV==="undefined")return;
  document.body.classList.add("mn-"+MNAV.cur);
  function L(){var b=document.querySelector(".lang-switch button.on");return b&&b.dataset.lang==="en"?"en":"vi";}
  function T(vi,en){return L()==="en"?en:vi;}
  var PAGES=DC.list("global.mnav.pages",function($k){return [
    {k:$k.v("home"),url:DC.x($k("global.mnav.u1"),0,"/"),n:[DC.x($k("global.mnav.1"),0,"Trang chủ"),DC.x($k("global.mnav.1"),1,"Home")],s:[DC.x($k("global.mnav.2"),0,"Câu chuyện · HLV · cộng đồng"),DC.x($k("global.mnav.2"),1,"Story · coach · community")]},
    {k:$k.v("shop"),url:DC.x($k("global.mnav.u2"),0,"/shop"),n:[DC.x($k("global.mnav.3"),0,"Shop"),DC.x($k("global.mnav.3"),1,"Shop")],s:[DC.x($k("global.mnav.4"),0,"Găng · áo · phụ kiện · đồ tập"),DC.x($k("global.mnav.4"),1,"Gloves · apparel · gear")]},
    {k:$k.v("course"),url:DC.x($k("global.mnav.u3"),0,"/khoa-hoc"),n:[DC.x($k("global.mnav.5"),0,"Khóa học"),DC.x($k("global.mnav.5"),1,"Courses")],s:[DC.x($k("global.mnav.6"),0,"Foundation · Group Training · PT 1-1"),DC.x($k("global.mnav.6"),1,"Foundation · Group Training · PT 1-on-1")]},
    {k:$k.v("services"),url:DC.x($k("global.mnav.u4"),0,"/dich-vu-setup"),n:[DC.x($k("global.mnav.7"),0,"Dịch vụ Setup"),DC.x($k("global.mnav.7"),1,"Gym Setup")],s:[DC.x($k("global.mnav.8"),0,"Thiết kế · thiết bị · setup phòng tập"),DC.x($k("global.mnav.8"),1,"Gym design · equipment · setup")]},
    {k:$k.v("ranking"),url:DC.x($k("global.mnav.u5"),0,"/xep-hang"),n:[DC.x($k("global.mnav.15"),0,"Academy Ranking"),DC.x($k("global.mnav.15"),1,"Academy Ranking")],s:[DC.x($k("global.mnav.16"),0,"Lịch sự kiện · ranking · võ sĩ"),DC.x($k("global.mnav.16"),1,"Events · rankings · fighters")]}
  ];});
  /* nút menu */
  var right=document.querySelector(".nav .nav-right");
  if(right&&!document.querySelector(".hamburger-btn")){right.insertAdjacentHTML("beforeend",'<button class="mn-btn" type="button" aria-label="menu"><span></span><span></span></button>');}
  document.body.insertAdjacentHTML("beforeend",'<div class="mn" id="mnPanel" aria-hidden="true"></div>');
  var panel=document.getElementById("mnPanel");
  function render(){
    var h='<div class="mn-top"><span class="mn-logo">'+DC.logoHtml(DC.x("global.brand",0,"DAPPER COMBAT"))+'</span><button class="mn-x" type="button" data-mn="close" aria-label="close">✕</button></div><nav class="mn-links">';
    PAGES.filter(function(p){return DC.navOn(p.k);}).forEach(function(p,i){var cur=p.k===MNAV.cur;
      h+='<a class="mn-link'+(cur?' cur':'')+'" '+(cur?'href="#" data-mn="close"':'href="'+p.url+'"')+'><em>0'+(i+1)+'</em><span><b>'+T(p.n[0],p.n[1])+'</b><small>'+(cur?T(DC.x("global.mnav.9",0,"Đang xem"),DC.x("global.mnav.9",1,"You are here")):T(p.s[0],p.s[1]))+'</small></span><i>→</i></a>';});
    h+='</nav>';
    if(MNAV.cur==="services")h+='<a class="mn-cta" href="#contact" data-go="contact">'+T(DC.x("global.mnav.10",0,"Nhận tư vấn setup miễn phí"),DC.x("global.mnav.10",1,"Get a free setup consultation"))+'</a>';
    else if(MNAV.cur==="course")h+='<a class="mn-cta" href="#dang-ky" data-reg="trial">'+T(DC.x("global.mnav.11",0,"Đăng ký học thử miễn phí"),DC.x("global.mnav.11",1,"Book a free trial"))+'</a>';
    else h+='<a class="mn-cta" href="'+MNAV.course+'">'+T(DC.x("global.mnav.12",0,"Đăng ký học thử miễn phí"),DC.x("global.mnav.12",1,"Book a free trial"))+'</a>';
    if(MNAV.cur==="shop")h+='<button class="mn-sec" type="button" data-mn="cart">'+T(DC.x("global.mnav.13",0,"Xem giỏ hàng"),DC.x("global.mnav.13",1,"View cart"))+'</button>';
    h+='<div class="mn-foot"><div class="mn-soc"><a href="'+MNAV.zalo+'" target="_blank" rel="noopener">'+T(DC.x("global.mnav.zalo",0,"Zalo"),DC.x("global.mnav.zalo",1,"Zalo"))+'</a><a href="'+MNAV.fb+'" target="_blank" rel="noopener">'+T(DC.x("global.mnav.fb",0,"Facebook"),DC.x("global.mnav.fb",1,"Facebook"))+'</a></div><p>30 Đường 128, Phước Long, TP. Thủ Đức, TP. Hồ Chí Minh</p></div>';
    panel.innerHTML=h;
  }
  function open(){render();panel.classList.add("on");panel.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
  function close(){panel.classList.remove("on");panel.setAttribute("aria-hidden","true");document.body.style.overflow="";}
  document.addEventListener("click",function(e){
    if(e.target.closest(".mn-btn,.hamburger-btn")){e.preventDefault();open();return;}
    var a=e.target.closest("[data-mn]");
    if(a){e.preventDefault();close();if(a.dataset.mn==="cart"&&typeof openCart==="function")setTimeout(openCart,250);return;}
    if(e.target.closest("#mnPanel [data-reg],#mnPanel [data-go],#mnPanel a[target]"))close();
  },true);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&panel.classList.contains("on"))close();});
  /* nhãn menu desktop thống nhất (VI: Trang chủ / Shop / Khóa học) + trạng thái đang xem */
  function labels(){
    var ul=document.querySelector(".nav .nav-links");
    if(ul&&MNAV.services&&ul.querySelectorAll(":scope>li>a").length<4)ul.insertAdjacentHTML("beforeend",'<li><a href="'+MNAV.services+'"></a></li>');
    /* mục "Xếp hạng" + menu thả xuống (Lịch sự kiện · Ranking · Võ sĩ) — dựng lại theo ngôn ngữ */
    var dd=ul&&ul.querySelector(".dc-dd");if(dd)dd.remove();if(ul&&DC.navDrop)ul.insertAdjacentHTML("beforeend",DC.navDrop(L()));
    var links=ul?ul.querySelectorAll(":scope>li>a"):[];
    PAGES.forEach(function(p,i){var a=links[i];if(!a)return;a.textContent=T(p.n[0],p.n[1]);a.classList.toggle("active",p.k===MNAV.cur);(a.closest("li")||a).style.display=DC.navOn(p.k)?"":"none";});
    var back=document.querySelector(".nav .nav-back");
    if(back&&MNAV.cur==="course"){back.textContent=T(DC.x("global.mnav.14",0,"Đăng ký"),DC.x("global.mnav.14",1,"Sign up"));back.setAttribute("href","#dang-ky");back.removeAttribute("target");back.dataset.reg="found";back.classList.add("mn-navcta");}
    if(panel.classList.contains("on"))render();
  }
  var ls=document.querySelector(".lang-switch");if(ls)ls.addEventListener("click",function(){setTimeout(labels,0);});
  labels();
})();

/* ticker 2 dòng: đủ dài để không hở trên màn rộng, và cùng một tốc độ (px/giây) cho cả 2 dòng */
(function(){
  var SPEED=50;
  function fill(t){var n=0;while(t.scrollWidth/2<innerWidth+200&&n<4){t.innerHTML+=t.innerHTML;n++;}}
  function sync(){document.querySelectorAll(".ticker-track").forEach(function(t){fill(t);var half=t.scrollWidth/2;if(half>0)t.style.animationDuration=(half/SPEED).toFixed(2)+"s";});}
  sync();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(sync);
  var rt;window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(sync,200);});
  var ls=document.querySelector(".lang-switch");if(ls)ls.addEventListener("click",function(){setTimeout(sync,60);});
})();

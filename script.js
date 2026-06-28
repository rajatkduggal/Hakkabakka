function showPage(pageId){
    let pages=document.querySelectorAll(".page");
    pages.forEach(page=>page.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
}

function openCart(){
    window.location.href="menu.html";
}

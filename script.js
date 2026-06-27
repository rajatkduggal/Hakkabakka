const TARGET_PHONE = "917796631555";

let cart = [];

const menuData = [
{name:"Paneer Tikka",price:240},
{name:"Dal Makhani Half",price:90},
{name:"Dal Makhani Full",price:180},
{name:"Butter Chicken Half",price:300},
{name:"Butter Chicken Full",price:550},
{name:"Mutton Rogan Josh Half",price:350},
{name:"Mutton Rogan Josh Full",price:650},
{name:"Tandoori Chicken Half",price:230},
{name:"Tandoori Chicken Full",price:400},
{name:"Chicken Rice Half",price:150},
{name:"Chicken Rice Full",price:250},
{name:"Mutton Rice Half",price:200},
{name:"Mutton Rice Full",price:300},
{name:"Tandoori Roti",price:10},
{name:"Butter Chapati",price:15},
{name:"Plain Naan",price:40},
{name:"Butter Naan",price:60},
{name:"Sweet Lassi",price:70},
{name:"Bottled Water",price:20}
];

function showPage(page){
document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
document.getElementById(page).classList.add('active');
}

function openCart(){
document.getElementById('cartSection').classList.remove('hidden');

let html = '<div class="menu-grid">';

menuData.forEach(item=>{
html += `
<div class="menu-item">
<h3>${item.name}</h3>
<p>₹${item.price}</p>
<button onclick="addToCart('${item.name}',${item.price})">Add</button>
</div>
`;
});

html += '</div>';

document.getElementById('menuItems').innerHTML = html;
}

function addToCart(name,price){
cart.push({name,price});
renderCart();
}

function renderCart(){
let total = 0;
let html = '';

cart.forEach(item=>{
total += item.price;
html += `<p>${item.name} - ₹${item.price}</p>`;
});

document.getElementById('cartItems').innerHTML = html;
document.getElementById('cartTotal').innerText = total;
}

function saveOrder(){

let name = document.getElementById('custName').value;
let phone = document.getElementById('custPhone').value;
let type = document.getElementById('orderType').value;

let orderText =
`Hakka Bakka Order

Name: ${name}
Phone: ${phone}
Order Type: ${type}

`;

cart.forEach(item=>{
orderText += `${item.name} - ₹${item.price}\n`;
});

orderText += `\nTotal: ₹${document.getElementById('cartTotal').innerText}`;

html2canvas(document.querySelector(".cart-box")).then(canvas=>{

let imgData = canvas.toDataURL("image/png");
localStorage.setItem("receipt",imgData);

const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

if(isMobile){
window.location.href =
`whatsapp://send?phone=${TARGET_PHONE}&text=${encodeURIComponent(orderText)}`;
}else{
window.open(
`https://web.whatsapp.com/send?phone=${TARGET_PHONE}&text=${encodeURIComponent(orderText)}`
);
}

});
}

let cart = {};
const TARGET_PHONE = "917796631555";

const menuItems = [
{ name:"Paneer Tikka", price:240 },
{ name:"Paneer Malai Tikka", price:280 },
{ name:"Paneer Kali Mirch Tikka", price:280 },
{ name:"Mushroom Tikka", price:230 },
{ name:"Soya Champ Tikka", price:220 },
{ name:"Dal Fry Half", price:80 },
{ name:"Dal Fry Full", price:150 },
{ name:"Dal Makhani Half", price:90 },
{ name:"Dal Makhani Full", price:180 },
{ name:"Butter Chicken Half", price:300 },
{ name:"Butter Chicken Full", price:550 },
{ name:"Tandoori Chicken Half", price:230 },
{ name:"Tandoori Chicken Full", price:400 },
{ name:"Mutton Rogan Josh Half", price:350 },
{ name:"Mutton Rogan Josh Full", price:650 },
{ name:"Chicken Rice Half", price:150 },
{ name:"Chicken Rice Full", price:250 },
{ name:"Mutton Rice Half", price:200 },
{ name:"Mutton Rice Full", price:300 },
{ name:"Tandoori Roti", price:10 },
{ name:"Butter Chapati", price:15 },
{ name:"Plain Naan", price:40 },
{ name:"Butter Naan", price:60 },
{ name:"Sweet Lassi", price:70 },
{ name:"Bottled Water", price:20 }
];

function renderMenu(){
    let html = "";
    menuItems.forEach((item,index)=>{
        html += `
        <div class="item">
            <h4>${item.name}</h4>
            <p>₹${item.price}</p>
            <button onclick="addToCart(${index})">Add</button>
        </div>`;
    });

    document.getElementById("menu").innerHTML = html;
}

function addToCart(index){
    let item = menuItems[index];

    if(!cart[item.name]){
        cart[item.name] = {
            name:item.name,
            price:item.price,
            qty:0
        };
    }

    cart[item.name].qty++;
    renderCart();
}

function renderCart(){
    let html = "";
    let total = 0;

    Object.values(cart).forEach(item=>{
        total += item.price * item.qty;

        html += `
        <div>
            ${item.name} x ${item.qty} = ₹${item.price * item.qty}
        </div>`;
    });

    document.getElementById("cartItems").innerHTML = html;
    document.getElementById("cartTotal").innerText = total;
}

function saveOrder(){
    let phone = document.getElementById("custPhone").value.trim();

    if(phone.length !== 10){
        alert("Enter valid mobile number");
        return;
    }

    let orderText = "HAKKA BAKKA ORDER\n";

    Object.values(cart).forEach(item=>{
        orderText += `${item.name} x ${item.qty}\n`;
    });

    orderText += `Total ₹${document.getElementById("cartTotal").innerText}`;

    localStorage.setItem("lastOrder", orderText);

    const isMobile = /Android|iPhone/i.test(navigator.userAgent);

    if(isMobile){
        window.open(
            `https://wa.me/${TARGET_PHONE}?text=${encodeURIComponent(orderText)}`,
            "_blank"
        );
    }else{
        window.open(
            `https://web.whatsapp.com/send?phone=${TARGET_PHONE}&text=${encodeURIComponent(orderText)}`,
            "_blank"
        );
    }
}

renderMenu();


let cart = JSON.parse(localStorage.getItem("hakkaCart")) || [];

function saveCart() {
    localStorage.setItem("hakkaCart", JSON.stringify(cart));
}

function addToCart(name, price) {
    let item = cart.find(x => x.name === name);

    if (item) {
        item.qty++;
    } else {
        cart.push({
            name: name,
            price: price,
            qty: 1
        });
    }

    saveCart();
    renderCart();
}

function changeQty(index, value) {
    cart[index].qty += value;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    renderCart();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

function renderCart() {
    let cartItems = document.getElementById("cartItems");
    let cartTotal = document.getElementById("cartTotal");
    let cartCount = document.getElementById("cartCount");

    if (!cartItems) return;

    let html = "";
    let total = 0;
    let count = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;
        count += item.qty;

        html += `
        <div class="cart-item">
            <div>
                <strong>${item.name}</strong><br>
                ₹${item.price}
            </div>

            <div>
                <button onclick="changeQty(${index},-1)">-</button>
                ${item.qty}
                <button onclick="changeQty(${index},1)">+</button>
            </div>
        </div>
        `;
    });

    cartItems.innerHTML = html;
    cartTotal.innerText = total;
    cartCount.innerText = count;
}

function toggleCart() {
    let panel = document.getElementById("cartPanel");

    if (panel.style.display === "block") {
        panel.style.display = "none";
    } else {
        panel.style.display = "block";
    }
}

function checkoutWhatsApp() {

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let customer = prompt("Enter Your Name");
    let mobile = prompt("Enter Mobile Number");
    let orderType = prompt("Order Type: Dine In / Delivery / Pickup");
    let tableNo = "";

    if (orderType.toLowerCase() === "dine in") {
        tableNo = prompt("Enter Table Number");
    }

    let address = "";

    if (orderType.toLowerCase() === "delivery") {
        address = prompt("Enter Delivery Address");
    }

    let note = prompt("Special Instructions (Optional)");

    let text = "*HAKKA BAKKA ORDER*%0A%0A";

    text += "*Customer:* " + customer + "%0A";
    text += "*Mobile:* " + mobile + "%0A";
    text += "*Order Type:* " + orderType + "%0A";

    if (tableNo) {
        text += "*Table No:* " + tableNo + "%0A";
    }

    if (address) {
        text += "*Address:* " + address + "%0A";
    }

    text += "%0A";

    let total = 0;

    cart.forEach(item => {
        text += item.name + " x" + item.qty + " = ₹" + (item.qty * item.price) + "%0A";
        total += item.qty * item.price;
    });

    let deliveryCharge = total < 500 ? 30 : 0;

    text += "%0A*Food Total:* ₹" + total + "%0A";
    text += "*Delivery Charge:* ₹" + deliveryCharge + "%0A";
    text += "*Grand Total:* ₹" + (total + deliveryCharge) + "%0A";

    if (note) {
        text += "%0A*Special Note:* " + note;
    }

    window.open(
        "https://wa.me/917796631555?text=" + text,
        "_blank"
    );
}

function searchMenu() {
    let input = document.getElementById("searchBox").value.toLowerCase();
    let cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        let txt = card.innerText.toLowerCase();

        if (txt.includes(input)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

window.onload = renderCart;

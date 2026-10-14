// =========================
// CART DATA
// =========================

const products = [
  {
    id: 1,
    name: "Classic Sourdough",
    price: 120
  },
  {
    id: 2,
    name: "Chocolate Croissant",
    price: 95
  },
  {
    id: 3,
    name: "Cheese Bread",
    price: 85
  },
  {
    id: 4,
    name: "Cinnamon Roll",
    price: 100
  },
  {
    id: 5,
    name: "Spanish Bread",
    price: 75
  },
  {
    id: 6,
    name: "Ube Bread",
    price: 90
  }
];

// =========================
// CART
// =========================

let cart = JSON.parse(
  localStorage.getItem("goldenCrustCart") || "[]"
);

// =========================
// MONEY FORMAT
// =========================

function money(number) {
  return "₱" + Number(number).toFixed(2);
}

// =========================
// ADD TO CART
// =========================

function addToCart(id) {
  const item = cart.find(
    item => item.id === id
  );
  if (item) {
    item.qty++;
  } else {
    cart.push({
      id: id,
      qty: 1
    });
  }
  saveCart();
  toast("Added to your cart!");
}

// =========================
// SAVE CART
// =========================

function saveCart() {
  localStorage.setItem(
    "goldenCrustCart",
    JSON.stringify(cart)
  );
  renderCart();
}

// =========================
// RENDER CART
// =========================

function renderCart() {
  const items =
    document.getElementById("cartItems");
  const countElement =
    document.getElementById("cartCount");
  const totalElement =
    document.getElementById("cartTotal");
  const count = cart.reduce(
    (total, item) => total + item.qty,
    0
  );
  countElement.textContent = count;
  // EMPTY CART
  if (cart.length === 0) {
    items.innerHTML = `
      <div class="empty">
        <span>🛒</span>
        Your cart is empty.
        <br>
        Add something delicious!
      </div>
    `;
    totalElement.textContent = money(0);
    return;
  }
  // CART ITEMS
  items.innerHTML = cart.map(item => {
    const product = products.find(
      product => product.id === item.id
    );
    if (!product) {
      return "";
    }
    return `
      <div class="cart-item">

        <div class="mini">
          🥐
        </div>

        <div>

          <h4>
            ${product.name}
          </h4>

          <small>
            ${money(product.price)} each
          </small>

          <div class="qty">

            <button
              type="button"
              onclick="changeQty(${product.id}, -1)"
            >
              −
            </button>

            <b>
              ${item.qty}
            </b>

            <button
              type="button"
              onclick="changeQty(${product.id}, 1)"
            >
              +
            </button>

          </div>

        </div>

        <button
          class="remove"
          type="button"
          onclick="removeItem(${product.id})"
        >
          Remove
        </button>

      </div>
    `;
  }).join("");
  // TOTAL
  const total = cart.reduce(
    (sum, item) => {
      const product = products.find(
        product => product.id === item.id
      );
      if (!product) {
        return sum;
      }
      return sum +
        (product.price * item.qty);
    },
    0
  );
  totalElement.textContent =
    money(total);
}

// =========================
// CHANGE QUANTITY
// =========================

function changeQty(id, amount) {
  const item = cart.find(
    item => item.id === id
  );
  if (!item) {
    return;
  }
  item.qty += amount;
  if (item.qty <= 0) {
    cart = cart.filter(
      item => item.id !== id
    );
  }
  saveCart();
}

// =========================
// REMOVE ITEM
// =========================

function removeItem(id) {
  cart = cart.filter(
    item => item.id !== id
  );
  saveCart();
  toast("Item removed.");
}

// =========================
// CART PANEL
// =========================

const panel =
  document.getElementById("cartPanel");
const overlay =
  document.getElementById("overlay");
function openCart() {
  panel.classList.add("open");
  overlay.classList.add("show");
}
function closeCart() {
  panel.classList.remove("open");
  overlay.classList.remove("show");
}
document
  .getElementById("cartBtn")
  .onclick = openCart;
document
  .getElementById("closeCart")
  .onclick = closeCart;
overlay.onclick = closeCart;

// =========================
// MOBILE MENU
// =========================

const menuBtn =
  document.getElementById("menuBtn");
const navMenu =
  document.getElementById("navMenu");
menuBtn.onclick = () => {
  navMenu.classList.toggle("open");
};
document
  .querySelectorAll("nav a")
  .forEach(link => {
    link.onclick = () => {
      navMenu.classList.remove("open");
    };
  });

// =========================
// DARK / LIGHT MODE
// =========================

const themeBtn =
  document.getElementById("themeBtn");
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  const isDark =
    document.body.classList.contains("dark");
  localStorage.setItem(
    "gcTheme",
    isDark ? "dark" : "light"
  );
  themeBtn.textContent =
    isDark ? "☀️" : "🌙";
};

// =========================
// LOAD SAVED THEME
// =========================

if (
  localStorage.getItem("gcTheme") === "dark"
) {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}

// =========================
// CHECKOUT MODAL
// =========================
const checkoutModal =
  document.getElementById("checkoutModal");

const closeCheckout =
  document.getElementById("closeCheckout");

const cancelCheckout =
  document.getElementById("cancelCheckout");

const placeOrderBtn =
  document.getElementById("placeOrderBtn");
// =========================
// OPEN CHECKOUT
// =========================
document
  .getElementById("checkoutBtn")
  .onclick = () => {
    if (cart.length === 0) {
      toast("Your cart is empty.");
      return;
    }
    checkoutModal.classList.add("show");
  };
// =========================
// CLOSE CHECKOUT
// =========================
function closeCheckoutModal() {
  checkoutModal.classList.remove("show");
}
closeCheckout.onclick =
  closeCheckoutModal;
cancelCheckout.onclick =
  closeCheckoutModal;
// =========================
// PLACE ORDER
// =========================
placeOrderBtn.onclick = async () => {
  // GET CUSTOMER INFORMATION
  const customerName =
    document
      .getElementById("customerName")
      .value
      .trim();
  const customerEmail =
    document
      .getElementById("customerEmail")
      .value
      .trim();
  const customerPhone =
    document
      .getElementById("customerPhone")
      .value
      .trim();
  // VALIDATE NAME
  if (!customerName) {
    toast("Please enter your name.");
    return;
  }
  // VALIDATE EMAIL
  if (!customerEmail) {
    toast("Please enter your email.");
    return;
  }
  // VALIDATE PHONE
  if (!customerPhone) {
    toast("Please enter your phone number.");
    return;
  }
  // SEND ORDER TO FLASK
  try {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent =
      "Placing Order...";
    const response =
      await fetch("/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cart: cart,
          customer_name:
            customerName,
          customer_email:
            customerEmail,
          customer_phone:
            customerPhone
        })
      });
    const data =
      await response.json();
    // SUCCESS
    if (data.success) {
      toast(
        `Order #${data.order_id} saved! Total: ${money(data.total)}`
      );
      // CLEAR CART
      cart = [];
      localStorage.removeItem(
        "goldenCrustCart"
      );
      renderCart();
      // CLEAR CUSTOMER INFORMATION
      document
        .getElementById("customerName")
        .value = "";
      document
        .getElementById("customerEmail")
        .value = "";
      document
        .getElementById("customerPhone")
        .value = "";
      // CLOSE POPUP
      closeCheckoutModal();
    } else {
      toast(
        data.message ||
        "Checkout failed."
      );
    }
  } catch (error) {
    console.error(
      "Checkout error:",
      error
    );
    toast(
      "Could not connect to the server."
    );
  }
  placeOrderBtn.disabled = false;
  placeOrderBtn.textContent =
    "Place Order";
};
// =========================
// TOAST MESSAGE
// =========================

function toast(message) {
  const toastBox =
    document.getElementById("toast");
  toastBox.textContent =
    message;
  toastBox.classList.add("show");
  clearTimeout(
    window.toastTimer
  );
  window.toastTimer =
    setTimeout(() => {
      toastBox.classList.remove(
        "show"
      );
    }, 2300);
}

// =========================
// CURRENT YEAR
// =========================

document
  .getElementById("year")
  .textContent =
  new Date().getFullYear();

// =========================
// PRODUCT BUTTONS
// =========================

document
  .querySelectorAll(".add-cart")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        const id =
          Number(button.dataset.id);
        addToCart(id);
      }
    );
  });

// =========================
// INITIAL CART DISPLAY
// =========================

renderCart();
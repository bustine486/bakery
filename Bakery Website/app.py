import os
import sqlite3
import smtplib
from email.message import EmailMessage

from flask import Flask, render_template, request, redirect, url_for
from dotenv import load_dotenv

# =========================
# LOAD ENVIRONMENT VARIABLES
# =========================
load_dotenv()

# =========================
# FLASK APP
# =========================
app = Flask(__name__)


# =========================
# GMAIL SETTINGS
# =========================
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

# =========================
# DATABASE
# =========================

DATABASE = "bakery.db"

def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection

def init_database():
    connection = get_db_connection()
    # Create orders table if it doesn't exist
    connection.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            total REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add customer columns if your old table already existed
    columns = [
        row["name"]
        for row in connection.execute(
            "PRAGMA table_info(orders)"
        ).fetchall()
    ]
    if "customer_name" not in columns:
        connection.execute(
            "ALTER TABLE orders ADD COLUMN customer_name TEXT"
        )
    if "customer_email" not in columns:
        connection.execute(
            "ALTER TABLE orders ADD COLUMN customer_email TEXT"
        )
    if "customer_phone" not in columns:
        connection.execute(
            "ALTER TABLE orders ADD COLUMN customer_phone TEXT"
        )
    # Create order items table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    """)
    connection.commit()
    connection.close()
    print("Database ready!")

# =========================
# PRODUCTS
# =========================

products = [
    {
        "id": 1,
        "name": "Classic Sourdough",
        "price": 120
    },
    {
        "id": 2,
        "name": "Chocolate Croissant",
        "price": 95
    },
    {
        "id": 3,
        "name": "Cheese Bread",
        "price": 85
    },
    {
        "id": 4,
        "name": "Cinnamon Roll",
        "price": 100
    },
    {
        "id": 5,
        "name": "Spanish Bread",
        "price": 75
    },
    {
        "id": 6,
        "name": "Ube Bread",
        "price": 90
    }
]


# =========================
# HOME PAGE
# =========================

@app.route("/")
def home():
    return render_template("index.html")

# =========================
# CONTACT FORM
# =========================

@app.route("/contact", methods=["POST"])
def contact():
    name = request.form.get("name")
    email = request.form.get("email")
    message = request.form.get("message")
    msg = EmailMessage()
    msg["Subject"] = "New message from Golden Crust Bakery website"
    msg["From"] = MAIL_USERNAME
    msg["To"] = MAIL_USERNAME
    msg["Reply-To"] = email
    msg.set_content(
        f"""New contact message

Name: {name}
Email: {email}

Message:
{message}
"""
    )
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(
                MAIL_USERNAME,
                MAIL_PASSWORD
            )
            server.send_message(msg)
        print("Email sent successfully!")
        return redirect(url_for("home"))
    except Exception as e:
        print("Email error:", e)
        return "There was a problem sending the message.", 500

# =========================
# CHECKOUT
# =========================

@app.route("/checkout", methods=["POST"])
def checkout():
    data = request.get_json()
    if not data or "cart" not in data:
        return {
            "success": False,
            "message": "No cart data received."
        }, 400
    cart = data["cart"]
    customer_name = data.get("customer_name")
    customer_email = data.get("customer_email")
    customer_phone = data.get("customer_phone")
    if not customer_name:
        return {
            "success": False,
            "message": "Customer name is required."
        }, 400
    if not customer_email:
        return {
            "success": False,
            "message": "Customer email is required."
        }, 400
    if not customer_phone:
        return {
            "success": False,
            "message": "Customer phone is required."
        }, 400
    if not cart:
        return {
            "success": False,
            "message": "Cart is empty."
        }, 400

    # =========================
    # CALCULATE ORDER
    # =========================

    total = 0
    order_items = []
    for item in cart:
        product_id = item.get("id")
        quantity = item.get("qty")
        product = next(
            (
                product
                for product in products
                if product["id"] == product_id
            ),
            None
        )
        if not product:
            continue
        item_total = product["price"] * quantity
        total += item_total
        order_items.append({
            "id": product["id"],
            "name": product["name"],
            "quantity": quantity,
            "price": product["price"]
        })

    # =========================
    # SAVE ORDER
    # =========================

    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO orders
        (
            customer_name,
            customer_email,
            customer_phone,
            total
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            customer_name,
            customer_email,
            customer_phone,
            total
        )
    )
    order_id = cursor.lastrowid

    # =========================
    # SAVE ORDER ITEMS
    # =========================

    for item in order_items:
        cursor.execute(
            """
            INSERT INTO order_items
            (
                order_id,
                product_id,
                product_name,
                quantity,
                price
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                order_id,
                item["id"],
                item["name"],
                item["quantity"],
                item["price"]
            )
        )
    connection.commit()
    connection.close()

    # =========================
    # SHOW ORDER IN TERMINAL
    # =========================

    print()
    print("========== NEW ORDER ==========")
    print(f"ORDER ID: {order_id}")
    print(f"NAME: {customer_name}")
    print(f"EMAIL: {customer_email}")
    print(f"PHONE: {customer_phone}")
    for item in order_items:
        item_total = item["price"] * item["quantity"]
        print(
            f"{item['name']} "
            f"x{item['quantity']} "
            f"= ₱{item_total:.2f}"
        )
    print(f"TOTAL: ₱{total:.2f}")
    print("==============================")
    print()
    return {
        "success": True,
        "message": "Order saved!",
        "total": total,
        "order_id": order_id
    }

# =========================
# RUN FLASK
# =========================

if __name__ == "__main__":
    init_database()
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
let products = JSON.parse(localStorage.getItem("smartstock")) || [
    { id: 1, name: "Blue Pen", category: "Writing", stock: 30, minimum: 40, sold: 0, previousSold: 0 },
    { id: 2, name: "Notebook", category: "Paper", stock: 100, minimum: 20, sold: 0, previousSold: 0 },
    { id: 3, name: "Pencil", category: "Writing", stock: 75, minimum: 25, sold: 0, previousSold: 0 },
    { id: 4, name: "Eraser", category: "Accessories", stock: 15, minimum: 20, sold: 0, previousSold: 0 },
    { id: 5, name: "Exam Pad", category: "Paper", stock: 60, minimum: 15, sold: 0, previousSold: 0 }
];

function saveData() {
    localStorage.setItem("smartstock", JSON.stringify(products));
}

function updateDashboard() {
    document.getElementById("totalProducts").innerText = products.length;

    let total = products.reduce((sum, p) => sum + p.stock, 0);
    document.getElementById("totalStock").innerText = total;

    let low = products.filter(p => p.stock <= p.minimum);
    document.getElementById("lowStock").innerText = low.length;

    let high = products.filter(p =>
        p.sold >= 5 && p.sold > p.previousSold * 1.5
    );

    document.getElementById("highDemand").innerText = high.length;

    displayAlerts();
    displayDemand();
    updateProductOptions();
}

function displayProducts() {
    let table = document.getElementById("productTable");
    let search = document.getElementById("search").value.toLowerCase();

    table.innerHTML = "";

    let filtered = products.filter(p =>
        p.name.toLowerCase().includes(search)
    );

    filtered.forEach(p => {
        let isLow = p.stock <= p.minimum;

        let row = `
            <tr>
                <td><strong>${escapeHTML(p.name)}</strong></td>
                <td>${escapeHTML(p.category)}</td>
                <td>${p.stock}</td>
                <td>${p.minimum}</td>
                <td>
                    <span class="status ${isLow ? "low" : "available"}">
                        ${isLow ? "Low Stock" : "Available"}
                    </span>
                </td>
                <td>
                    <button class="action-btn" onclick="sellProduct(${p.id})">Sell</button>
                    <button class="action-btn" onclick="deleteProduct(${p.id})" style="background:#dc6262">Delete</button>
                </td>
            </tr>
        `;

        table.innerHTML += row;
    });

    updateDashboard();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

// Add new product

document.getElementById("productForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let name = document.getElementById("productName").value.trim();
    let category = document.getElementById("category").value;
    let quantity = Number(document.getElementById("quantity").value);
    let minimum = Number(document.getElementById("minimum").value);

    if (!name || quantity < 0 || minimum < 0) {
        alert("Please enter valid product details.");
        return;
    }

    if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert("This product already exists. Use Stock Purchase instead.");
        return;
    }

    products.push({
        id: Date.now(),
        name,
        category,
        stock: quantity,
        minimum,
        sold: 0,
        previousSold: 0
    });

    saveData();
    displayProducts();
    this.reset();

    alert("Product added successfully!");
});

// Purchase new stock

document.getElementById("purchaseForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let id = Number(document.getElementById("purchaseProduct").value);
    let quantity = Number(document.getElementById("purchaseQuantity").value);

    let product = products.find(p => p.id === id);

    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
        alert("Please enter a valid purchase quantity.");
        return;
    }

    product.stock += quantity;

    saveData();
    displayProducts();
    this.reset();

    alert("Purchased stock added successfully!");
});

// Record sales

document.getElementById("salesForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let id = Number(document.getElementById("salesProduct").value);
    let quantity = Number(document.getElementById("salesQuantity").value);

    let product = products.find(p => p.id === id);

    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
        alert("Please enter a valid sales quantity.");
        return;
    }

    if (quantity > product.stock) {
        alert("Not enough stock available!");
        return;
    }

    product.stock -= quantity;
    product.sold += quantity;

    saveData();
    displayProducts();
    this.reset();

    alert("Sale recorded successfully!");
});

// Sell button in inventory table

function sellProduct(id) {
    let product = products.find(p => p.id === id);

    let quantity = Number(prompt("Enter quantity sold for " + product.name));

    if (!Number.isInteger(quantity) || quantity <= 0) return;

    if (quantity > product.stock) {
        alert("Not enough stock available!");
        return;
    }

    product.stock -= quantity;
    product.sold += quantity;

    saveData();
    displayProducts();
}

// Delete product

function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    products = products.filter(p => p.id !== id);

    saveData();
    displayProducts();
}

// Update dropdown options

function updateProductOptions() {
    let purchaseSelect = document.getElementById("purchaseProduct");
    let salesSelect = document.getElementById("salesProduct");

    purchaseSelect.innerHTML = "";
    salesSelect.innerHTML = "";

    products.forEach(p => {
        purchaseSelect.innerHTML += `
            <option value="${p.id}">${escapeHTML(p.name)}</option>
        `;

        if (p.stock > 0) {
            salesSelect.innerHTML += `
                <option value="${p.id}">${escapeHTML(p.name)} (${p.stock} available)</option>
            `;
        }
    });
}

// Low stock alerts

function displayAlerts() {
    let alertList = document.getElementById("alertList");

    let lowProducts = products.filter(p => p.stock <= p.minimum);

    if (lowProducts.length === 0) {
        alertList.innerHTML = '<div class="empty">All products have sufficient stock! ✓</div>';
        return;
    }

    alertList.innerHTML = lowProducts.map(p => `
        <div class="alert-item">
            <span>⚠️ ${escapeHTML(p.name)}</span>
            <strong>${p.stock} left</strong>
        </div>
    `).join("");
}

// High demand detection

function displayDemand() {
    let demandList = document.getElementById("demandList");

    let highProducts = products.filter(p =>
        p.sold >= 5 && p.sold > p.previousSold * 1.5
    );

    if (highProducts.length === 0) {
        demandList.innerHTML = `
            <div class="empty">
                No high-demand products detected yet.
                Record sales to discover popular products.
            </div>
        `;
        return;
    }

    demandList.innerHTML = highProducts.map(p => `
        <div class="demand-item">
            <span>📈 ${escapeHTML(p.name)}</span>
            <strong>${p.sold} units sold</strong>
            <span>High Demand</span>
        </div>
    `).join("");
}

// Set date

document.getElementById("date").innerText =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

// Initial display

displayProducts();
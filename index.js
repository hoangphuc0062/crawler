const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://cellphones.com.vn/mobile.html", {
    waitUntil: "networkidle2",
  });

  while (true) {
    try {
      // Cuộn xuống cuối trang để hiển thị nút
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForSelector(".button__show-more-product", {
        timeout: 3000,
      });

      // Nhấn vào nút "Xem thêm"
      await page.evaluate(() => {
        document.querySelector(".button__show-more-product").click();
      });

      // Tạm dừng 3 giây
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("Đã nhấn nút 'Xem thêm' lần thứ ", i++);
    } catch (error) {
      console.log(
        "Không tìm thấy hoặc không thể nhấn vào nút 'Xem thêm':",
        error
      );
      break;
    }
  }

  const data = await page.evaluate(() => {
    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function generateSlug(name) {
      return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const products = [];
    document.querySelectorAll(".product-item").forEach((product) => {
      const nameElement = product.querySelector(".product__name");
      const priceElement = product.querySelector(".product__price--through");
      const imageElement = product.querySelector(".product__image img");
      const ref = product.querySelector(".product-info a").href;

      const discountElement = product.querySelector(
        ".product__price--percent-detail"
      );

      const rawName = nameElement ? nameElement.textContent.trim() : null;
      const brand = rawName.split(" ")[0];
      const rawPrice = priceElement
        ? priceElement.textContent.trim()
        : product.querySelector(".product__price--show").textContent.trim();
      let rawDiscount = discountElement
        ? discountElement.textContent.trim()
        : null;
      const thumbnail = imageElement ? imageElement.src : null;

      if (rawDiscount) {
        const match = rawDiscount.match(/\d+/);
        rawDiscount = match ? match[0] : null;
      }
      const page2 = browser.newPage();
      page2.goto(ref, {
        waitUntil: "networkidle2",
      });

      let rawProduct = {
        name: rawName,
        slug: generateSlug(rawName),
        SKU: "MB" + "-" + random(1000, 9999),
        price: parseInt(rawPrice.replace(/\D/g, "")),
        historicalPrice: price - 1000000,
        priceInMarket: price,
        discount: rawDiscount ? parseInt(rawDiscount) : null,
        inStock: random(0, 100),
        onStock: random(0, 100),
        inComing: random(0, 100),
        unit: "Cái",
        weight: random(1.2, 3),
        minInventory: 10,
        maxInventory: 10000,
        isBattery: true,
        stopSelling: false,
      };

      products.push(rawProduct);
    });
    return products;
  });
  console.log(data);
  await browser.close();
})();

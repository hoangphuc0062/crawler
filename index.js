const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://cellphones.com.vn/mobile.html", {
    waitUntil: "networkidle2",
  });
  const loadAllProducts = async (page) => {
    const buttonSelector = ".button__show-more-product";
    let buttonExists = true;
    let i = 1;
    while (i < 15) {
      // Kiểm tra nút có tồn tại không
      buttonExists = await page.evaluate((selector) => {
        return !!document.querySelector(selector);
      }, buttonSelector);

      if (buttonExists) {
        // Cuộn chuột để đảm bảo nút nằm trong khung nhìn
        await page.evaluate((selector) => {
          const button = document.querySelector(selector);
          if (button) {
            button.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, buttonSelector);

        // Nhấn vào nút "Xem thêm"
        try {
          await page.click(buttonSelector);
          console.log("Clicked 'Xem thêm' lần" + i);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          i++;
        } catch (error) {
          console.log("Error clicking 'Xem thêm' button:", error);
          break;
        }
      } else {
        console.log("'Xem thêm' button no longer exists. Stopping...");
      }
    }
  };

  // Gọi hàm loadAllProducts
  await loadAllProducts(page);

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

      const imageElement = product.querySelector(".product__image img");
      const priceElement = product.querySelector(".product__price--through");
      const ref = product.querySelector(".product-info a").href;
      const discountElement = product.querySelector(
        ".product__price--percent-detail"
      );

      const rawName = nameElement ? nameElement.textContent.trim() : null;
      const rawPrice = priceElement
        ? priceElement.textContent.trim()
        : product.querySelector(".product__price--show").textContent.trim();
      let rawDiscount = discountElement
        ? discountElement.textContent.trim()
        : null;
      const thumbnail = imageElement ? imageElement.src : null;
      const brand = rawName ? rawName.split(" ")[0] : null;
      if (rawDiscount) {
        const match = rawDiscount.match(/\d+/);
        rawDiscount = match ? match[0] : null;
      }

      let price = parseInt(rawPrice.replace(/\D/g, ""));

      products.push({
        name: rawName,
        category: "Điện thoại",
        brand,
        slug: generateSlug(rawName),
        SKU: "MB" + "-" + random(1000, 9999),
        price,
        thumbnail,
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
        view: random(10, 1000),
        ref,
      });
    });

    return products;
  });

  for (const product of data) {
    const detailPage = await browser.newPage();
    const detailURL = `${product.ref}`;

    console.log("Navigating to", detailURL);
    try {
      await detailPage.goto(detailURL, { waitUntil: "networkidle2" });

      const detailData = await detailPage.evaluate(async () => {
        const images = Array.from(
          document.querySelectorAll(".spotlight img")
        ).map((img) => img.src);
        const shortDescriptions = Array.from(
          document.querySelectorAll(".box-content .description")
        )
          .map((desc) => desc.textContent.trim())
          .join("<br>");

        const storageOptions = Array.from(
          document.querySelectorAll(".list-linked .item-linked")
        );

        const variants = [];
        storageOptions.forEach((storageOption) => {
          const storage = storageOption
            .querySelector("strong")
            .textContent.trim();
          const price = parseInt(
            storageOption.querySelector("span").textContent.replace(/\D/g, "")
          );

          const colorVariants = Array.from(
            document.querySelectorAll(".box-product-variants .item-variant")
          );

          colorVariants.forEach((variant) => {
            const id = variant.getAttribute("data-product-id");
            const name = variant
              .querySelector(".item-variant-name")
              .textContent.trim();
            const thumbnail = variant.querySelector("img").src;

            variants.push({
              id,
              name,
              storage,
              price,
              thumbnail,
              inStock: random(0, 100),
              onStock: random(0, 100),
              inComing: random(0, 100),
              unit: "Cái",
              weight: random(1.2, 3),
              minInventory: 10,
              maxInventory: 10000,
              isBattery: true,
              stopSelling: false,
              view: random(10, 1000),
            });
          });
        });
        // Cuộn chuột xuống mỗi lần 100px và kiểm tra sự tồn tại của nút
        let showModalButton = null;
        for (let i = 0; i < 100; i++) {
          window.scrollBy(0, 100);
          await new Promise((resolve) => setTimeout(resolve, 100)); // Đợi một chút sau mỗi lần cuộn
          showModalButton = document.querySelector(
            ".button__show-modal-technical.my-3.is-flex.is-justify-content-center"
          );
          if (showModalButton) {
            console.log("Show modal button found, clicking...");
            showModalButton.click();
            break;
          }
        }

        if (!showModalButton) {
          console.log("Show modal button not found");
        }

        // Đợi một chút để modal hiển thị
        await new Promise((resolve) => setTimeout(resolve, 5000));

        let attributes = {};
        const valueEl = document.querySelectorAll(
          ".technical-content-modal-item.my-3"
        );

        if (valueEl.length !== 0) {
          valueEl.forEach((valueItem) => {
            const titleElement = valueItem.querySelector(".title.is-6.m-2");
            if (titleElement) {
              const key = titleElement.textContent.trim();
              const descriptions = valueItem.querySelectorAll(
                ".modal-item-description .px-3.py-2.is-flex.is-align-items-center.is-justify-content-space-between"
              );
              const details = Array.from(descriptions)
                .map((description) => {
                  const pElement = description.querySelector("p");
                  const divElement = description.querySelector("div");
                  if (pElement && divElement) {
                    const subKeyRaw = pElement.textContent
                      .trim()
                      .replace(/\s+/g, " ");
                    const subKey = subKeyRaw.replace(/:/g, " ");
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = divElement.innerHTML
                      .replace(/<br\s*\/?>/gi, " ")
                      .replace(/\s+/g, " ");
                    const subValue = Array.from(tempDiv.childNodes)
                      .map((node) =>
                        node.nodeType === Node.TEXT_NODE
                          ? node.textContent
                          : node.textContent
                      )
                      .join(" ")
                      .trim();
                    return `${subKey}: ${subValue}`;
                  }
                  return null;
                })
                .filter((detail) => detail !== null)
                .join(", ");
              attributes[key] = details;
            }
          });
        } else {
          attributes = {
            "Không có thông số kỹ thuật": "Không có thông số kỹ thuật",
          };
        }

        // description
        const contentEl = document.getElementById("cpsContent");
        let htmlContent = "";

        const secondChildElements = contentEl.querySelectorAll(":nth-child(2)");

        secondChildElements.forEach((el) => {
          htmlContent += el.outerHTML.replace(/\s+/g, " ").trim();
        });

        return {
          images,
          shortDescriptions,
          htmlContent,
          variants,
          attributes,
        };
      });

      product.variants = detailData.variants;
      product.images = detailData.images;
      product.shortDescription = detailData.shortDescriptions;
      product.description = detailData.htmlContent;
      product.attributes = detailData.attributes;
    } catch (error) {
      console.log(`Error navigating to ${detailURL}:`, error);
    } finally {
      delete product.ref;
      await detailPage.close();
    }
  }

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  await browser.close();
})();

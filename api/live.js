export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const response = {
    ok: true,
    updatedAt: new Date().toISOString(),
    usdTry: null,
    goldUsdOunce: null,
    gramTryRef: null,
    sources: {
      usdTry: "TCMB günlük kur",
      goldUsdOunce: "Test değeri",
      gramTryRef: "Hesaplanan referans"
    },
    notes: []
  };

  try {
    // 1) TCMB today.xml'den USD/TRY çek
    const tcmbResp = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: { "Accept": "application/xml,text/xml" }
    });

    if (!tcmbResp.ok) {
      throw new Error("TCMB verisi alınamadı");
    }

    const xmlText = await tcmbResp.text();

    // USD için ForexSelling veya ForexBuying yakala
    const usdBlockMatch = xmlText.match(/<Currency[^>]*Kod="USD"[\s\S]*?<\/Currency>/i);
    if (usdBlockMatch) {
      const usdBlock = usdBlockMatch[0];
      const sellingMatch = usdBlock.match(/<ForexSelling>(.*?)<\/ForexSelling>/i);
      const buyingMatch = usdBlock.match(/<ForexBuying>(.*?)<\/ForexBuying>/i);

      const usdText =
        (sellingMatch && sellingMatch[1]) ||
        (buyingMatch && buyingMatch[1]) ||
        null;

      if (usdText) {
        response.usdTry = Number(usdText.replace(",", "."));
        response.sources.usdTry = "TCMB today.xml";
      }
    }

    // 2) FRED varsa günlük altın referansı al
    const fredKey = process.env.FRED_API_KEY;

    if (fredKey) {
      const fredUrl =
        `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=GOLDPMGBD228NLBM` +
        `&api_key=${fredKey}` +
        `&file_type=json` +
        `&sort_order=desc&limit=10`;

      const fredResp = await fetch(fredUrl, {
        headers: { "Accept": "application/json" }
      });

      if (fredResp.ok) {
        const fredJson = await fredResp.json();
        const latest = (fredJson.observations || []).find(
          (item) => item.value && item.value !== "."
        );

        if (latest) {
          response.goldUsdOunce = Number(latest.value);
          response.sources.goldUsdOunce = "FRED / LBMA günlük referans";
        }
      }
    }

    // 3) FRED yoksa test değeri kullan
    if (!response.goldUsdOunce) {
      const testGold = process.env.TEST_GOLD_OUNCE_USD || "3325";
      response.goldUsdOunce = Number(testGold);
      response.sources.goldUsdOunce = "Test değeri (env)";
      response.notes.push("FRED_API_KEY eklenmediği için ons altın test değeri kullanıldı.");
    }

    // 4) Referans gram hesapla
    if (response.usdTry && response.goldUsdOunce) {
      response.gramTryRef = Number(
        ((response.goldUsdOunce * response.usdTry) / 31.1034768).toFixed(2)
      );
    } else {
      response.ok = false;
      response.notes.push("USD/TRY veya ons altın eksik olduğu için gram hesaplanamadı.");
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(200).json({
      ok: false,
      updatedAt: new Date().toISOString(),
      usdTry: null,
      goldUsdOunce: Number(process.env.TEST_GOLD_OUNCE_USD || "3325"),
      gramTryRef: null,
      sources: {
        usdTry: "Hata",
        goldUsdOunce: "Test değeri (env)",
        gramTryRef: "Hesaplanamadı"
      },
      notes: [error.message || "Bilinmeyen hata"]
    });
  }
}

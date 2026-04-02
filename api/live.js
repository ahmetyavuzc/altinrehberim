let cache = {
  data: null,
  time: 0
};

function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const now = Date.now();
  const CACHE_MS = 120000; // 2 dakika

  if (cache.data && now - cache.time < CACHE_MS) {
    return res.status(200).json({
      ...cache.data,
      cache: true,
      stale: false
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      message: "TWELVE_DATA_API_KEY tanımlı değil."
    });
  }

  try {
    const [goldResp, usdResp] = await Promise.all([
      fetch(`https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${apiKey}`),
      fetch(`https://api.twelvedata.com/price?symbol=USD/TRY&apikey=${apiKey}`)
    ]);

    const goldJson = await goldResp.json();
    const usdJson = await usdResp.json();

    const goldUsdOunce = Number(goldJson.price);
    const usdTry = Number(usdJson.price);

    if (
      !goldUsdOunce || !usdTry ||
      Number.isNaN(goldUsdOunce) || Number.isNaN(usdTry)
    ) {
      if (cache.data) {
        return res.status(200).json({
          ...cache.data,
          cache: true,
          stale: true,
          source: "Son başarılı veri"
        });
      }

      return res.status(200).json({
        ok: false,
        message: "Canlı veri şu an alınamıyor."
      });
    }

    const gramTryRef = round((goldUsdOunce * usdTry) / 31.1034768);
    const gram22Ref = round(gramTryRef * 0.916);
    const quarterRef = round(gramTryRef * 1.75);
    const halfRef = round(gramTryRef * 3.5);
    const fullRef = round(gramTryRef * 7.0);
    const ataRef = round(gramTryRef * 7.2);

    let direction = "normal";
    let suggestion = "Karşılaştırarak al";
    let comment = "Piyasa orta bölgede. Kapalıçarşı ve banka makasını karşılaştırmak önemli.";

    if (usdTry > 40 && goldUsdOunce > 3000) {
      direction = "pahali";
      suggestion = "Dikkatli ol";
      comment = "Kur ve ons birlikte yüksek. Acele alım yerine karşılaştırmalı hareket etmek daha güvenli olabilir.";
    } else if (usdTry < 35 && goldUsdOunce < 2600) {
      direction = "uygun";
      suggestion = "Daha uygun seviye";
      comment = "Kur ve ons daha sakin. Referans hesaplara göre daha makul seviyeler görülebilir.";
    }

    const data = {
      ok: true,
      fallback: false,
      cache: false,
      stale: false,
      updatedAt: new Date().toISOString(),
      source: "Twelve Data",
      goldUsdOunce: round(goldUsdOunce, 4),
      usdTry: round(usdTry, 4),
      gramTryRef,
      gram22Ref,
      quarterRef,
      halfRef,
      fullRef,
      ataRef,
      direction,
      suggestion,
      comment
    };

    cache = {
      data,
      time: now
    };

    return res.status(200).json(data);
  } catch (err) {
    if (cache.data) {
      return res.status(200).json({
        ...cache.data,
        cache: true,
        stale: true,
        source: "Son başarılı veri"
      });
    }

    return res.status(200).json({
      ok: false,
      message: "API hatası: " + (err.message || "bilinmeyen hata")
    });
  }
}

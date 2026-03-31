<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Altın Rehberim</title>

<style>
body {
    margin:0;
    font-family: Arial, sans-serif;
    background:#0f1115;
    color:white;
}

.container {
    max-width:500px;
    margin:auto;
    padding:20px;
}

.card {
    background:#1a1d24;
    padding:16px;
    border-radius:12px;
    margin-bottom:15px;
}

.title {
    font-size:22px;
    font-weight:bold;
    margin-bottom:10px;
}

.big {
    font-size:32px;
    font-weight:bold;
    color:#ffd700;
}

.small {
    color:#aaa;
}

.green { color:#4caf50; }
.orange { color:#ff9800; }

.loading {
    text-align:center;
    margin-top:50px;
    color:#888;
}
</style>
</head>

<body>

<div class="container">

<div class="title">Altın Rehberim</div>

<div id="loading" class="loading">Veri yükleniyor...</div>

<div id="app" style="display:none">

<div class="card">
    <div class="small">Gram Altın (referans)</div>
    <div id="gram" class="big">-</div>
</div>

<div class="card">
    <div class="small">Ons Altın ($)</div>
    <div id="ons">-</div>
</div>

<div class="card">
    <div class="small">Dolar / TL</div>
    <div id="usd">-</div>
</div>

<div class="card">
    <div class="small">Bugün nereden alınmalı?</div>
    <div id="yer" class="green">-</div>
</div>

<div class="card">
    <div class="small">Yorum</div>
    <div id="yorum">-</div>
</div>

</div>

</div>

<script>

async function loadData() {
    try {
        const res = await fetch('/api/live');
        const data = await res.json();

        if(!data.ok){
            throw new Error("API hata");
        }

        const gram = data.gramTryRef.toFixed(2);
        const usd = data.usdTry.toFixed(2);
        const ons = data.goldUsdOunce.toFixed(2);

        document.getElementById("gram").innerText = gram + " TL";
        document.getElementById("usd").innerText = usd + " TL";
        document.getElementById("ons").innerText = ons + " $";

        // basit yorum motoru
        if(data.usdTry > 30){
            document.getElementById("yer").innerText = "Kapalıçarşı";
            document.getElementById("yer").className = "green";
            document.getElementById("yorum").innerText = "Bankalara göre daha avantajlı görünüyor.";
        } else {
            document.getElementById("yer").innerText = "Bankalar";
            document.getElementById("yer").className = "orange";
            document.getElementById("yorum").innerText = "Bankalar daha uygun olabilir.";
        }

        document.getElementById("loading").style.display = "none";
        document.getElementById("app").style.display = "block";

    } catch (e) {
        document.getElementById("loading").innerText = "Veri alınamadı";
    }
}

loadData();

</script>

</body>
</html>

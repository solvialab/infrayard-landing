# Infrayard: SEO a Google Search Console

Pripravené 17. októbra 2026, doplnené 5. novembra 2026. Search Console vidí obsah až po nasadení na verejnú doménu.

## Čo je pripravené v projekte

- Jednotné, samostatné titulky a popisy pre landing page, docs, články, právne stránky a demo.
- Kanonické URL na `https://www.infrayard.eu/`, údaje pre zdieľanie, favicon a jazyk stránky.
- Prepojené entity WebSite, Organization, WebPage, články a breadcrumbs. Komerčné predplatné je označené ako Service s reálnymi ponukami. Nevkladáme vymyslené recenzie ani hviezdičky.
- `sitemap.xml` pre 27 kanonických HTML stránok, s obrázkami a video záznamom pri `/demo/`. Samostatný video sitemap netreba posielať.
- `robots.txt` povoľuje verejný obsah všetkým crawlerom vrátane vyhľadávacích a AI botov; pracovné priečinky sú vylúčené.
- `ai.md` obsahuje aktuálne produktové fakty; `llms.txt` stručný prehľad a odkazy; `llms-full.txt` aj celú verejnú dokumentáciu.
- Pôvodný overovací súbor `googlebfff5ec03fea908c.html` zostal zachovaný.
- `vercel.json` pripravuje presmerovania duplicitných `index.html` URL, jednotné koncové lomky a správne typy crawler súborov. Nasadzuje sa iba verejný obsah z `dist/`.

`lastmod` a dátumy úprav sa nemenia pri každom zostavení. Pri podstatnej úprave obsahu aktualizuj `site.updated` v `content/site.mjs`. Samotný build nie je aktualizáciou obsahu.

## Pred budúcim nasadením

1. Skontroluj a schváľ lokálny obsah vrátane cien a nového videa.
2. Pri prvom verejnom nasadení videa s hudbou nastav v `content/seo.mjs` hodnotu `demo.publishedAt` na jeho skutočný dátum prvého zverejnenia. Použi ISO dátum alebo presný čas s časovým pásmom. Pri ďalších buildoch tento dátum nemeň. Kým je hodnota `null`, video je v HTML aj video sitemap, ale build zámerne nevytvára neúplný VideoObject ani nevymýšľa dátum publikovania.
3. Spusti:

   ```sh
   npm run build
   npm run check
   npm test
   npm run export
   ```

4. `dist/` je pripravený verejný statický web. Neobsahuje pracovné zdroje, testy, lokálne nástroje ani tento návod. Lokálny export nič nepublikuje. Vercel má v `vercel.json` nastavené zostavenie, kontroly a výstup `dist`; po schválení sa zmeny nasadia bežným postupom projektu.
5. V nastaveniach Vercelu zachovaj presmerovanie `infrayard.eu` na `www.infrayard.eu`. Na verejnej produkcii skontroluj, že firewall ani bot protection nevyžadujú interaktívnu challenge od legitímnych crawlerov. Neverejné preview nechaj chránené pred indexovaním.
6. Po nasadení over, že `/`, `/docs/`, `/demo/`, `/resources/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/ai.md`, poster aj MP4 vracajú úspešnú odpoveď. MP4 musí ísť prehrať a posúvať. Neexistujúca URL má vracať 404. Zmeny v lokálnom kóde samy neoveria odpovede produkčného servera.

## Doplnené 5. novembra 2026

- Každá stránka dokumentácie má vlastný popis pre výsledky vyhľadávania (110–160 znakov) v `content/seo.mjs` → `docsDescriptions`. Kratší popis v `content/site.mjs` zostáva ako text v navigácii a pod nadpisom. `npm run check` odmietne popis kratší ako 50 alebo dlhší ako 170 znakov.
- `ai.md` a `llms.txt` majú sekciu **Deployment**: self-hosted, Helm (OKE alebo k3s), Keycloak, privátna registry, OCI používateľ a VPN-only prístup.
- `404.html`: vlastná stránka „Page not found“ s odkazmi, `noindex`, mimo sitemap. Vercel ju vráti so stavom 404.
- `/.well-known/security.txt` (RFC 9116): kontakt `support@infrayard.eu`, platnosť rok od `site.updated`. Kontrola zlyhá, keď platnosť vyprší; stačí aktualizovať `site.updated` a znovu zostaviť.
- **IndexNow** (Bing a ďalšie vyhľadávače; z Bingu čerpajú aj ChatGPT search a Copilot): kľúč v `content/seo.mjs` → `indexNowKey`, súbor `/<kľúč>.txt` vytvára build. Po každom nasadení s podstatnou zmenou spusti `npm run indexnow` (všetky URL zo sitemap) alebo `npm run indexnow -- /docs/` (iba časť). Google IndexNow nepoužíva, číta sitemap.
- `demo.publishedAt` je `2026-10-17` (prvé verejné nasadenie videa s hudbou, commit 3555ead). `/demo/` má teraz VideoObject a sitemap dátum publikovania; Search Console predtým hlásil „Video isn't on a watch page“.
- Pôvodné nahrávky `assets/final_hq*.mp4` zostávajú v repozitári pre `scripts/mix-demo.py`, ale export ich už nepublikuje. Staré `docs/readme.md` a `docs/features.md` majú hlavičku `X-Robots-Tag: noindex`.
- Search Console: používaj službu `https://www.infrayard.eu/`. Služba `https://infrayard.eu/` ukazuje iba presmerované adresy, preto má 0 indexovaných stránok.
- Presmerovanie `infrayard.eu` → `www.infrayard.eu` má byť trvalé (**308**), nie dočasné (307). Nastavuje sa vo Vercel → Project → Settings → Domains pri `infrayard.eu`.

## Po pushi z 5. novembra 2026 (inštalácia iba OKE alebo k3s, cenník)

- Stránka `/docs/install-vm/` je zrušená a vo `vercel.json` trvalo presmerovaná (308) na `/docs/install-kubernetes/`. V sitemap už nie je. Google ju z indexu vyradí sám; nástroj **Removals** netreba.
- V **URL Inspection** požiadaj o indexovanie zmenených stránok:

  ```text
  https://www.infrayard.eu/
  https://www.infrayard.eu/docs/installation/
  https://www.infrayard.eu/docs/install-kubernetes/
  https://www.infrayard.eu/docs/requirements/
  https://www.infrayard.eu/docs/operations/
  https://www.infrayard.eu/docs/subscription/
  ```

- Spusti `npm run indexnow` a v **Sitemaps** znovu odošli `sitemap.xml`.
- O týždeň skontroluj v **Page indexing**, že `/docs/install-vm/` je v skupine „Page with redirect“ a žiadna URL zo sitemap nie je v chybách.

## 1. Vlastníctvo webu v Search Console

Otvor [Google Search Console](https://search.google.com/search-console/).

Ak už máš overenú službu pre Infrayard, použi ju. Nie je potrebné zakladať novú pre tento redesign.

Pri novom nastavení je vhodná služba typu **Domain** s hodnotou `infrayard.eu`. Pokrýva HTTP/HTTPS aj varianty s `www`. U poskytovateľa DNS pridaj overovací záznam vydaný Googlom a ponechaj ho aj po overení.

Alternatívou je **URL prefix** pre `https://www.infrayard.eu/` s HTML overením. Existujúci overovací súbor sme zachovali; patrí účtu, ktorému ho Google vydal. Ak dostaneš nový, pridaj presne tento nový súbor do koreňa webu. Domain služba vyžaduje DNS overenie.

Postup Googlu: [Overenie vlastníctva](https://support.google.com/webmasters/answer/9008080).

## 2. Odošli jeden sitemap

Po nasadení v Search Console otvor **Sitemaps → Add a new sitemap** a vlož:

```text
https://www.infrayard.eu/sitemap.xml
```

Pri URL-prefix službe môže rozhranie doménu predvyplniť; vtedy dopíš iba `sitemap.xml`. Ak už je táto adresa odoslaná, zostáva rovnaká. Po zmene ju môžeš znovu odoslať a skontrolovať posledné načítanie a stav **Success**.

Do Google sa nenahráva súbor ako príloha. Oznamuješ mu adresu súboru na verejnom webe. Neposielaj osobitne `robots.txt`, `ai.md`, `llms.txt`, `llms-full.txt`, docs Markdown ani MP4. Google si stránky, obrázky a video nájde cez sitemap a odkazy. Pri budúcich zmenách sa sitemap automaticky obnoví pri builde.

Postup Googlu: [Sitemaps report](https://support.google.com/webmasters/answer/7451001).

## 3. Požiadaj o nové prehľadanie dôležitých URL

V nástroji **URL Inspection** postupne vlož tieto verejné URL:

```text
https://www.infrayard.eu/
https://www.infrayard.eu/demo/
https://www.infrayard.eu/docs/
https://www.infrayard.eu/docs/subscription/
https://www.infrayard.eu/resources/
https://www.infrayard.eu/resources/oke-self-service-platform.html
```

Pri každej použi **Test live URL**. Over úspešné načítanie, povolené indexovanie a vykreslený obsah. Potom použi **Request indexing**. Žiadosť má význam po nasadení novej verzie. Pre ostatné stránky stačí sitemap; ručné opakovanie každej URL každý deň nepomáha.

V uloženom výsledku kontroly následne sleduj **User-declared canonical** a **Google-selected canonical**. Majú smerovať na preferovanú HTTPS URL s `www`. Google si kanonickú URL vyberá sám; `rel=canonical`, sitemap a presmerovania mu dávajú konzistentné signály.

Postup Googlu: [URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en). Odoslanie sitemap ani žiadosť nezaručujú okamžité indexovanie.

## 4. Skontroluj vzhľad a technické reporty

- V [Rich Results Test](https://search.google.com/test/rich-results) otestuj homepage, jeden článok, jednu docs stránku a `/demo/`. Pri deme sa VideoObject objaví až po doplnení skutočného dátumu prvého verejného publikovania a builde.
- V **Page indexing** rieš najmä neočakávané `noindex`, blokovanie robots.txt, chyby servera, soft 404 a kanonické konflikty na URL zo sitemap. Presmerované `index.html` varianty nemusia byť samostatne indexované.
- V **Video indexing**, ak sa report zobrazí, sleduj predovšetkým `/demo/`, kde je video hlavným obsahom. Video na hlavnej predajnej stránke nemusí byť samostatne indexované ako hlavný obsah stránky.
- V **Core Web Vitals** a [PageSpeed Insights](https://pagespeed.web.dev/) sleduj mobilnú verziu, stabilitu rozloženia a rýchlosť zobrazenia hlavného obsahu. Pre malý nový web nemusí Google hneď ukazovať dostatok návštevníckych dát.
- V **Manual actions** a **Security issues** over, že nie je problém. Nevytváraj nové odstránenia URL ani disavow súbor bez konkrétneho dôvodu.

Štruktúrované dáta opisujú skutočný obsah. Nie každý typ má osobitný Google rich result a zobrazenie rich výsledku nie je garantované. Viditeľné FAQ zostalo užitočné pre návštevníka; pri tomto komerčnom webe nesľubujeme FAQ rozšírenia vo výsledkoch.

## 5. Čo sledovať po spustení

Po prvých približne 2–4 týždňoch skontroluj **Performance → Search results** a rozdeľ značkové a neznačkové dopyty. Zaujímavé témové okruhy sú OKE self-service platform, Oracle Kubernetes Engine provisioning, OCI internal developer platform, OKE BYON a kubeconfig access. Sleduj zobrazenia, kliknutia, CTR, vstupné stránky a relevantnosť návštev; pri nízkom objeme nevyhodnocuj jednotlivé dni.

Rozhoduj podľa reálnych dopytov. Nepridávaj desiatky veľmi podobných článkov iba pre obmeny kľúčového slova. Ak sa dva existujúce IDP články dlhodobo prekrývajú pri rovnakom zámere vyhľadávania, podľa dát zváž ich zlúčenie s trvalým presmerovaním. Teraz sme ich adresy zachovali.

Google pre svoje AI funkcie nevyžaduje `llms.txt` ani špeciálnu AI schému. Dôležitý je dostupný, indexovateľný a užitočný obsah s konzistentnými údajmi. AI súbory sú doplnkom pre nástroje, ktoré ich používajú, nie zárukou citácií alebo pozícií. [Oficiálne vysvetlenie Googlu](https://developers.google.com/search/docs/appearance/ai-features).

Po schválení a verejnom nasadení teda do Search Console pridávaš najmä **adresu sitemap** a pri niekoľkých prioritných stránkach žiadaš o indexovanie. Súbory samotné zostávajú na webe.

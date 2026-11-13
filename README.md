# Perełki

Codzienna tablica ogłoszeń klasyków w promieniu około 100 mil od San Mateo (Mercedes SL, klasyczne Porsche i inne auta). Strona jest statyczna i działa na GitHub Pages: [https://lorddraagonix.github.io/perelki/](https://lorddraagonix.github.io/perelki/).

Cały interfejs jest po polsku. Nie ma backendu ani płatnych usług.

## Jednorazowe włączenie strony

Kod sam nie może włączyć GitHub Pages. Właściciel repozytorium musi to kliknąć raz:

1. Wejdź w repozytorium → **Settings** → **Pages**.
2. W **Build and deployment** ustaw **Source: GitHub Actions** (nie „Deploy from a branch”).
3. Jeśli workflow [Deploy GitHub Pages](https://github.com/Lorddraagonix/perelki/actions/workflows/pages.yml) jest czerwony, otwórz go i kliknij **Re-run jobs**.

Dopiero wtedy strona jest pod adresem [https://lorddraagonix.github.io/perelki/](https://lorddraagonix.github.io/perelki/). Kolejne push na `main` publikują ją same.

## Codzienna aktualizacja

Jedyny plik, który trzeba zmieniać każdego dnia, to [`data/listings.json`](data/listings.json).

1. Otwórz `data/listings.json`.
2. Ustaw `updated` (czas ISO 8601) i `updatedLabel` (tekst pokazywany na stronie, np. `4 listopada 2026, 8:00 PT`).
3. Dopisz, popraw albo usuń obiekty w `listings`.
4. Ustaw `segment`: `klasyki` albo `nowsze`. Na **Najlepsze okazje** dopisz `id` do `topPicks` (klasyki) albo `topPicksNowsze`. Nie zmieniaj `id`, które już jest w pliku.
5. Zrób commit na `main` i wypchnij. GitHub Actions opublikuje stronę samo.

Ulubione zostają w przeglądarce telefonu. Jak ogłoszenie zniknie z pliku, a ktoś miał je w ulubionych, karta zostaje wyszarzona z napisem „Ogłoszenie usunięte”.

Reszty plików (`index.html`, `styles.css`, `app.js`) nie ruszaj przy zwykłej aktualizacji.

## Schemat `data/listings.json`

```json
{
  "updated": "2026-11-03T11:45:00-08:00",
  "updatedLabel": "3 listopada 2026, 11:45 PT",
  "safety": "Krótka wskazówka pokazywana na górze strony.",
  "topPicks": ["id-ogloszenia"],
  "labels": {
    "deal": {
      "perelka": "Perełka",
      "dobra": "Dobra cena",
      "aukcja": "Aukcja trwa",
      "rynek": "Cena rynkowa",
      "drogo": "Drogo"
    },
    "category": {
      "sl": "Mercedes SL",
      "mercedes": "Mercedes inne",
      "porsche": "Porsche",
      "bmw": "BMW",
      "audi": "Audi",
      "alfa": "Alfa Romeo",
      "japo": "Japońskie",
      "euro": "Inne europejskie",
      "us": "Amerykańskie"
    },
    "brand": {
      "mercedes": "Mercedes",
      "porsche": "Porsche",
      "bmw": "BMW",
      "toyota": "Toyota"
    },
    "condition": {
      "run": "Na chodzie",
      "proj": "Projekt"
    }
  },
  "listings": []
}
```

Każdy element `listings`:

| Pole | Typ | Znaczenie |
| --- | --- | --- |
| `id` | string | Unikalny identyfikator. Nie zmieniaj go przy aktualizacji — ulubione w telefonie są podpięte pod to `id`. |
| `title` | string | Tytuł na karcie. |
| `price` | number | Cena w dolarach. Przy aukcji to aktualna oferta. |
| `mileage` | number lub `null` | Przebieg w milach. `null`, gdy nieznany. |
| `city` | string | Miasto. |
| `distanceMiles` | number | Mile w linii prostej / dojazd od San Mateo. |
| `source` | string | Np. `Craigslist`, `Bring a Trailer`, `ClassicCars.com`. |
| `url` | string | Pełny adres `https://` oryginalnego ogłoszenia. Otwiera się w nowej karcie. |
| `photo` | string | Pełny adres `https://` zdjęcia. Jak się nie wczyta, karta zostaje bez zdjęcia. |
| `condition` | `run` albo `proj` | `run` = na chodzie, `proj` = projekt. |
| `category` | kod z `labels.category` | Grupa na filtrze: Mercedes SL, Mercedes inne, Porsche, BMW, Audi, Alfa Romeo, Japońskie, Inne europejskie, Amerykańskie. |
| `brand` | kod z `labels.brand` | Marka na osobnym filtrze, np. `toyota`, `ford`, `vw`. |
| `deal` | `perelka`, `dobra`, `aukcja`, `rynek` albo `drogo` | Etykieta okazji. |
| `rare` | `true` albo `false` | `true` tylko przy potwierdzonej rzadkości (liczba z fabryki, rejestru, Hagerty albo opisu BaT). Na karcie daje znaczek „Rzadkie”. |
| `know` | string lub `null` | Krótka polska notka „Co warto wiedzieć”: opcje, które podnoszą wartość, i słabe punkty. Bez liczby sztuk, jeśli nie ma źródła. |
| `note` | string | Polska notatka na karcie: stan i uwagi. |
| `marketNote` | string lub `null` | Starsze zdania o porównaniu z rynkiem. Karta pokazuje `profit.compNote`, gdy jest. |
| `profit` | obiekt | Szacunek, nie wycena. Patrz niżej. |
| `posted` | `YYYY-MM-DD` lub `null` | Data dodania ogłoszenia. |
| `auctionEnd` | string lub `null` | Koniec aukcji, np. `6 lis, 11:47 PT`. Gdy ustawione, cena ma przedrostek „Oferta:”. |
| `scamWarning` | string lub `null` | Ostrzeżenie (czerwona ramka). `null`, gdy go nie ma. |
| `segment` | `klasyki`, `nowsze` albo `kevin` | Która karta na górze strony. Brak pola znaczy `klasyki`, więc starszy plik dalej działa. `kevin` to karta **Kevina auta** (rocznik od 2021, Mercedes, BMW, Audi). |
| `flags` | tablica stringów | Krótkie czerwone flagi, np. `Tytuł salvage`, `Płatność krypto`. Pusta tablica, gdy nie ma. |
| `year` | number lub brak | Rocznik. Na karcie Kevina, jak pola nie ma, rok jest brany z tytułu. |
| `model` | string lub brak | Model na filtrze Kevina, np. `GLE` albo `X5`. Jak pola nie ma, strona próbuje odczytać model z tytułu. |
| `trim` | string lub `null` | Dopisek wyposażenia, np. `AMG Line 4MATIC`, `xDrive`, `S line quattro`. |
| `titleStatus` | `clean`, `rebuilt`, `salvage` lub `null` | Stan tytułu. Na karcie: czysty, rebuilt albo salvage. |
| `damage` | `none`, `light` lub `null` | `none` = bez uszkodzeń, `light` = lekko uszkodzony (rysy, blacha), mechanicznie w porządku. |
| `damageNote` | string lub `null` | Krótki opis uszkodzenia po polsku. |
| `repairCost` | number lub `null` | Startowa kwota w kalkulatorze naprawy (blacharka i lakier, bez robocizny). Użytkownik może ją zmienić w przeglądarce; plik się od tego nie zmienia. |
| `marketValue` | number lub `null` | Wartość rynkowa. Jak puste, karta bierze `profit.sellAsIsValue`. Inaczej pokazuje „brak danych”. |
| `checkNote` | string lub `null` | Co sprawdzić, np. `sprawdzić lasery`. |

`profit`:

| Pole | Typ | Znaczenie |
| --- | --- | --- |
| `buyPrice` | number lub `null` | Cena z ogłoszenia albo obecna oferta aukcji. `null`, gdy aukcja nie ma jeszcze oferty. |
| `suggestedOffer` | number lub `null` | Szacunek oferty do negocjacji. `null`, gdy nie ma podstawy (np. cena sztywna albo brak widełek w ogłoszeniu). Na karcie jest podpisane „szacunek”. |
| `sellAsIsValue` | number lub `null` | Realna szybka sprzedaż w obecnym stanie. Tylko gdy jest świeży, podobny wynik (najczęściej BaT). Inaczej `null` i karta pisze „brak danych”. |
| `sellAfterRepairValue` | number lub `null` | Wartość po ogarnięciu usterek z ogłoszenia. `null`, gdy nie ma komparatora dla już ogarniętego auta. |
| `estPartsCost` | number lub `null` | Koszt części, bez robocizny. `null`, gdy ogłoszenie nie wskazuje konkretnej usterki albo nie ma ceny części. |
| `estProfitAsIs` | number lub `null` | `sellAsIsValue - buyPrice`. Strona liczy to jeszcze raz przy wyświetlaniu. |
| `estProfitAfterRepair` | number lub `null` | `sellAfterRepairValue - buyPrice - estPartsCost`. Wymaga wszystkich trzech liczb. |
| `compNote` | string lub `null` | Skąd wzięta liczba: model, data i kwota sprzedaży. Przy aukcji dopisz, że kupno to obecna oferta. |

Nie wpisuj kwoty „na oko”. Jak nie ma podobnej sprzedaży, zostaw `null`.

`topPicks` to klasyki na karcie **Najlepsze okazje**. `topPicksNowsze` to to samo dla karty **Nowsze auta**. Opcjonalne `topPicksKevin` ogranicza **Najlepsze okazje** na karcie Kevina; jak listy nie ma, ta karta pokazuje wszystkie ogłoszenia `segment: "kevin"` od największego rabatu. `labels` tłumaczy kody na polskie napisy.

Rabat na karcie Kevina to `marketValue` (albo `profit.sellAsIsValue`) minus cena z ogłoszenia, w dolarach i w procentach. Kalkulator naprawy dodaje wpisaną cenę zakupu i koszt blachy. Zapisuje się tylko w przeglądarce na czas wizyty.

Ulubione zostają w przeglądarce pod stałym `id` (klucz `perelki-ulubione-v2`). Jak ogłoszenie zniknie z pliku, karta zostaje wyszarzona. Nie zmieniaj `id` istniejącego auta przy codziennej poprawce.

`safety` to czerwona wskazówka na górze (zaliczka, VIN, tytuł).

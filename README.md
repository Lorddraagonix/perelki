# Perełki

Codzienna tablica ogłoszeń klasyków w promieniu około 100 mil od San Mateo (Mercedes SL, klasyczne Porsche i inne auta). Strona jest statyczna i działa na GitHub Pages: [https://lorddraagonix.github.io/perelki/](https://lorddraagonix.github.io/perelki/).

Cały interfejs jest po polsku. Nie ma backendu ani płatnych usług.

## Codzienna aktualizacja

Jedyny plik, który trzeba zmieniać każdego dnia, to [`data/listings.json`](data/listings.json).

1. Otwórz `data/listings.json`.
2. Ustaw `updated` (czas ISO 8601) i `updatedLabel` (tekst pokazywany na stronie, np. `4 listopada 2026, 8:00 PT`).
3. Dopisz, popraw albo usuń obiekty w `listings`.
4. Jeśli auto ma być na karcie **Najlepsze okazje**, dopisz jego `id` do `topPicks` (i usuń stamtąd, gdy przestaje być okazją).
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
      "porsche": "Porsche",
      "inne": "Inne klasyki"
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
| `id` | string | Unikalny identyfikator. Zostaw ten sam, gdy tylko poprawiasz cenę. |
| `title` | string | Tytuł na karcie. |
| `price` | number | Cena w dolarach. Przy aukcji to aktualna oferta. |
| `mileage` | number lub `null` | Przebieg w milach. `null`, gdy nieznany. |
| `city` | string | Miasto. |
| `distanceMiles` | number | Mile w linii prostej / dojazd od San Mateo. |
| `source` | string | Np. `Craigslist`, `Bring a Trailer`, `ClassicCars.com`. |
| `url` | string | Pełny adres `https://` oryginalnego ogłoszenia. Otwiera się w nowej karcie. |
| `photo` | string | Pełny adres `https://` zdjęcia. Jak się nie wczyta, karta zostaje bez zdjęcia. |
| `condition` | `run` albo `proj` | `run` = na chodzie, `proj` = projekt. |
| `category` | `sl`, `porsche` albo `inne` | Mercedes SL, Porsche, inne klasyki. |
| `deal` | `perelka`, `dobra`, `aukcja`, `rynek` albo `drogo` | Etykieta okazji. |
| `note` | string | Polska notatka na karcie: stan, uwagi i porównanie z rynkiem. |
| `marketNote` | string lub `null` | Same zdania o porównaniu z rynkiem (BaT, mediana). Może być `null`, karta i tak pokazuje `note`. |
| `posted` | `YYYY-MM-DD` lub `null` | Data dodania ogłoszenia. |
| `auctionEnd` | string lub `null` | Koniec aukcji, np. `6 lis, 11:47 PT`. Gdy ustawione, cena ma przedrostek „Oferta:”. |
| `scamWarning` | string lub `null` | Ostrzeżenie (czerwona ramka). `null`, gdy go nie ma. |
| `flags` | tablica stringów | Krótkie czerwone flagi, np. `Tytuł salvage`, `Płatność krypto`. Pusta tablica, gdy nie ma. |

`topPicks` to lista `id` w kolejności karty **Najlepsze okazje**. `labels` tłumaczy kody na polskie napisy — zmieniaj je tylko, gdy chcesz zmienić słownictwo na całej stronie.

`safety` to czerwona wskazówka na górze (zaliczka, VIN, tytuł).

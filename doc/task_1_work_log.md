# Początek pracy nad zadaniem 1 - 01.03.2025

Do wykonania tego zadania wykorzystałem najnowszą aplikację Claude Code w wersji beta, do której dostałem dostęp w czwartek.

Przygotowałem dodatkową instrukcję dla tego narzędzia by poradził sobie lepiej z tym projektem. Rozdzieliłem implementację na frontend i backend. W przypadku backendu narzędzie poradziło sobie lepiej, potrzebna była jedna poprawka w skrypcie do inicjalizacji modelu SAM2. W przypadku frontendu było więcej problemów, ale po kilku iteracjach udało się uruchomić aplikacje w stanie. Frontend wymagał trochę modyfikacji, szczególnie okno do podglądu wideo. Aplikacja Claude Code działa na płatnym API, koszt wyprodukowania backendu to 1.15 dolara a frontendu z poprawkami 4.8 dolara. Więc koszt używania jest dość duży, plusem za to jest czas, ponieważ utworzenie całkiem niezłego szablonu działającej aplikacji zajęło około 1.5h.

**Co dalej?**

- Manualne testy aplikacji, aby wyłapać i poprawić błędy w działaniu.
- Sprawdzenie, czy aplikacja w takim stanie spełnia założenia.
- Sprawdzenie działania modelu

**Podsumowanie:**

W sumie praca nad kodem oraz nad utworzeniem dodatkowej instrukcji zajęła około 3h.

# Druga iteracja 01.03

Poprawiłem kilka rzeczy związanych z frontendem jak: przyciski do zmiany ramek, część widoku odpowiedzialna za segmentację oraz poprawiłem lokalizacje i działanie przycisku włączania/wyłączania wideo.

**Co jest do zrobienia:**

- Trzeba dostosować działanie SAM2 - na ten moment to co zrobił Claude Code jest do poprawy, wszystkie segmenty znajdują się jeden na drugim w lewym rogu ramki, podejrzewa, że jest coś nie tak ze współrzędnymi.
- Do weryfikacji jest animacja procesowania dodawanego wideo - po dodaniu wideo w głównym oknie aplikacji, na miniaturce video jest animacja informująca o procesowaniu wideo, która sam nie zniknie, trzeba odświeżyć stronę.
- Brak miniaturek w dodanych nagraniach na ekranie głównym.

**Podsumowanie:**

Praca nad tymi poprawkami zajęło około 2 - 3h w tym próbowałem poprawić backend (wstrzymane, póki co). Zdecydowałem, że wstrzymam prace nad tym zadaniem na rzecz kolejnych zadań związanych z ML.

Podsumowując, udało mi się przetestować nowe narzędzie Claude Code, działa całkiem dobrze, porównywalnie do Claude Desktop w połączeniu z serwerami MCP. Nie mniej, koszt użycia jest dość duży.

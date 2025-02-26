# Początek pracy nad zadaniem 2 - 26.02.2025

Poprosiłem Claude 3.7 Sonnet z serwerem MCP do GitHub aby zapoznał się z projektem oraz zaproponował rozwiązanie zadania 2.

Czat wygenerował mi strukturę projektu (inspirowaną tą dołączoną do opisu zadania) oraz zawartości do poszczególnych plików. 

Przekopiowałem to wszystko no i działą :) - uruchomiło się po małych poprawkach, które powstały przez to, że przerywało się generowanie odpowiedzi ze względu na długość tych odpowiedzi.

Ja u siebie w przeglądarce mam jeden błąd związany z wtyczką d sprawdzania gramatyki, ignoruje to. Sprawdziłem w innej przeglądarce, bez tej wtyczki i błędu nie ma.

## Testowanie transkrybcji

Wykonywanie nagrań działa, ale pojawia się problem z serwerem przy wykonywaniu transkrypcji. Z informacji wynika, że jest to problem z biblioteką libwhisper.so.

Jakies pole na to potrzebne:
whisper-cli: error while loading shared libraries: libwhisper.so.1: cannot open shared object file: No such file or directory

### Problem

Problemem u mnie było błędne zainstalowanie  libwhisper.so.1. Postanowiłem przebudować ręcznie whisper-cli za pomocą:

```bash
# Zmień katalog na wskazany
cd /home/kacper/Documents/Projects/technical-assessment-tasks/examples/whisper-server/server/models

# Sklonuj repozytorium
git clone https://github.com/ggerganov/whisper.cpp.git

# Zmień katalog na sklonowane repozytorium
cd whisper.cpp

# Utwórz katalog build
mkdir -p build

# Zmień katalog na build
cd build

# Skonfiguruj projekt przy użyciu CMake
cmake .. -DBUILD_SHARED_LIBS=ON

# Skompiluj projekt
make

# Zainstaluj skompilowany projekt
sudo make install

# Zaktualizuj cache bibliotek
sudo ldconfig
```

Ostatnim krokiem było przekopiowanie whisper-cli do folderu models/ tak, aby zgadzało się wszystko z konfiguracją serwera.

Docelowo udało się poprawić skrypt do inicjalizacji modelu pod linux i teraz działa wszystko ze skryptem do inicjalizacji model_init.sh

### Problem

Był problem z wykonaniem transkrypcją - serwer w konsoli wyświetlał informacje o problemu z plikiem nagrania. Rozwiązaniem problemu było błędne założenie, że nagrywany głos poprzez aplikacje internetową będzie typu .wav. Po researchu okazało się, że przeglądarki głównie używają formatu .webm. Zmiana na ten format rozwiązała problem.

## Aplikacja 'działa'

Teraz działa mi wykonywanie notatek 🙂 Stan aplikacji:

- Utworzona podstawowa wersja aplikacji
    - Główne okno aplikacji, gdzie dodany jest przycisk do wykonania healthcheck sprawdzający połączenie z serwerem, opcja nagrywania audio oraz jego odsłuchanie, wykonywanie transkrypcji
    - W głównym oknie jest podgląd wykonanych notatek

### Co jest dalej do zrobienia?

- Poprawa kolorów w aplikacji → np w oknie edycji jest biały tekst w białym oknie.
- Implementacja opcji edytowania przeprowadzonej transkrypcji.
- Testowanie wykonywania transkrypcji z różnymi parametrami konfiguracji - dostosowanie modelu.
- Dashboard nie jest interaktywny.
- Dodanie testów do aplikacji.
- Można by dodać jakiś formatter, bo przez przeklejanie kodu z czatu formatowanie rozjeżdża się.
- Więcej testów manualnych - zastanowienie się nad zastanowienie się nad przypadkami granicznymi, w POC nie koniecznie musimy handlować wszystkich przypadki, ale te najbardziej oczywiste, które mogłyby wyjść przy prezentacji interesariuszom musimy obsłużyć.
    - Trzeba na pewno sprawdzić, czy działa określanie kategorii notatki.
- Przejrzeć dokładniej co AI wygenerowało, zarówno kod jak i opis oraz instrukcję.
- Musze pomyśleć nad priorytetami tyvh i zapewne kolejnych zadań jakie wyjdą w trakcie testowania.

## Wnioski

Nie mam doświadczenia w programowaniu w javascript jak i typescript. Dlatego postanowiłem zrobić całą podstawę aplikacji z wykorzystaniem najnowszych narzędzi. 

- vs code z wtyczką continue → lokalny model **DeepSeek-R1-Distill-Qwen-1.5B.**
- Zapoznałem się z **Model Context Protocol** - używam Linux’a gdzie anthropic nie udostępnia aplikacji desktopowej, na szczęście znalazłem repozytorium ze skryptem do budowania aplikacji. Dołączyłem 3 serwery: **Brave** **Search**, **Filesystem** oraz **GitHub**.
- Używam najnowszej wersji **Claude 3.7 Sonnet.**

Po zapoznaniu czatu z repozytorium poprosiłem go o przygotowanie rozwiązania na zadanie 2. Dzięki bardzo dobremu opisowi, który został przygotowany w tym zadaniu, czat poradził sobie naprawdę bardzo dobrze. Porównałem jego działanie z wersją Claude 3.5 Sonnet i różnica w ich działaniu jest dość zauważalna np Claude 3.7 Sonnet ma mniej problemu z używaniem narzędzi dostarczanych przez serwery MCP.

Pierwsze uruchomienie aplikacji udało się bez problemu, problemy były z transkrypcją, a dokładniej z niedziałającym whisper-cli. 

Podsumowanie pierwszej iteracji mojej pracy:

- Poniedziałek - zapoznanie z zadaniem - około 1h
- Wtorek - uświadomienie sobie, że nie znam typescript, zapoznanie z nowym modelem Claude 3.7 Sonnet oraz agentem do kodowania Claude Code (zapisanie się na listę oczekujących, aby przetestować jego działanie), konfiguracja Claude Desktop z serwerami MCP - około 3h
- Środa - rozpoczecie pracy nad zadaniem 2, wykonanie tego co zostało opisane powyżej zajęło około 4h w tym 1h rozwiązywałem wspomniany problem z whisper-cli

# Druga iteracja

- Rozwiązałem problem z białym kolorem tekstu na białym tle.

Następnie podjąłem decyzję, że na potrzeby tego prototypownia najważniejsze jest działanie zarówno transkrypcji jak i klasyfikacji notatek. Przy testach manualnych i próbach pisania testów jednostkowych, pojawił się problem z określeniem kategorii notatek. Ma to związek z tym, że kategorie są w języku angielskim a notatki są po polsku. Musze to zmienić.

Dodatkowo zauważyłem, że nie mam klasyfikacji medycznej, poprosiłem czat, aby je dla mnie dodał. 

**Do zastanowienia:**

Teraz mam polskie klasyfikację odnośnie medycyny a ogólne kategorie mam po angielsku. Jako że startup dotyczy weterynarii, w kolejnej iteracji pozbędę się ogólnej klasyfikacji a zostawię tylko klasyfikację medyczną, po polsku. Dodam również testy.

**Obserwacje:**

Tym razem poprosiłem czar z połączonymi serwerami MCP aby sam modyfikował mój kod w repozytorium. Wychodzi mu to nawet dobrze. Najgorszy przypadek jest, gdy w czasie jego pracy nad plikami zostanie osiągnięty limit kontekstu, wtedy po ponowieniu jego pracy powstają błędy. Dodatkowo czasem występują jakieś błędy z serwerów MCP, które czasem powodują problem a czasem nie. Na co można zwrócić uwagę, to że wszystkie zmiany rozbijane są na osobne commity, rozumiem to, ale dobrze na koniec je scalić jak bardzo się da. 

**Podsumowanie:**

Na testy i modyfikacje poświęciłem ponad 2h, sporo czasu zajęły testy, których finalnie nie zaimplementowałem. Lepiej początkowo poprawić klasyfikowanie.

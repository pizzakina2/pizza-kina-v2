Podmień w repo te pliki 1:1 i zrób deploy.

Kroki:
1. Nadpisz pliki w repo dokładnie tymi wersjami.
2. W Cloud Shell:
   cd ~/pizza-kina-v2
   git pull
   npx firebase-tools deploy

Po deployu otwórz:
https://pizza-kina-v2.web.app/?v=final1

Ta paczka naprawia:
- zgodność eksportów/importów auth.js <-> client.js
- działanie modala logowania
- stan zalogowania / wylogowania
- przejście do panelu po roli
- strony verify/reset

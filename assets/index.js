  function formatMessage(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  }

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.hidden && element.offsetParent !== null);
  }

  function trapFocusIn(container, event) {
    const focusable = getFocusableElements(container);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initCleanGallery(gallery) {
    const track = gallery.querySelector(".gallery-clean-track");
    const shuffledImages = shuffleArray(Array.from(track.querySelectorAll("img")));
    track.replaceChildren(...shuffledImages);
    const images = Array.from(track.querySelectorAll("img"));
    const prevButton = gallery.querySelector(".gallery-clean-prev");
    const nextButton = gallery.querySelector(".gallery-clean-next");

    const modal = document.getElementById("gallery-modal");
    const modalImage = modal.querySelector(".gallery-modal-image");
    const modalClose = modal.querySelector(".gallery-modal-close");
    const modalPrev = modal.querySelector(".gallery-modal-prev");
    const modalNext = modal.querySelector(".gallery-modal-next");
    const modalStatus = modal.querySelector("#gallery-modal-status");

    let index = 0;
    let lightboxIndex = 0;
    let visible = getVisibleCount();
    let lastFocusedElement = null;
    let autoInterval = null;

    function getVisibleCount() {
      if (window.innerWidth <= 760) return 1;
      if (window.innerWidth <= 1080) return 2;
      return 4;
    }

    function getMaxIndex() {
      return Math.max(0, images.length - visible);
    }

    function updateGallery() {
      visible = getVisibleCount();
      gallery.style.setProperty("--gallery-visible", visible);

      const maxIndex = getMaxIndex();
      if (index > maxIndex) index = maxIndex;

      const imageWidth = images[0]?.getBoundingClientRect().width || 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 14;
      const offset = index * (imageWidth + gap);

      track.style.transform = `translateX(-${offset}px)`;
      const canLoop = images.length > visible;
      prevButton.disabled = !canLoop;
      nextButton.disabled = !canLoop;
    }

    function goTo(newIndex) {
      const maxIndex = getMaxIndex();
      if (maxIndex <= 0) {
        index = 0;
      } else if (newIndex < 0) {
        index = maxIndex;
      } else if (newIndex > maxIndex) {
        index = 0;
      } else {
        index = newIndex;
      }
      updateGallery();
    }

    function stopAutoMotion() {
      window.clearInterval(autoInterval);
      autoInterval = null;
    }

    function startAutoMotion() {
      stopAutoMotion();
      if (isMotionReduced() || images.length <= visible) return;
      autoInterval = window.setInterval(() => {
        const maxIndex = getMaxIndex();
        goTo(index >= maxIndex ? 0 : index + 1);
      }, 4200);
    }

    function getGalleryImageLabel(img, imgIndex) {
      const lang = document.documentElement.lang || "pl";
      const dict = translations[lang] || translations.pl;
      const rawAlt = (img.getAttribute("alt") || "").trim();
      if (rawAlt && !/^Galeria Dom Latarnika \d+$/i.test(rawAlt)) return rawAlt;
      return `${dict.gallery_image_fallback} ${imgIndex + 1}`;
    }

    function refreshImageAccessibility() {
      images.forEach((img, imgIndex) => {
        const label = getGalleryImageLabel(img, imgIndex);
        img.tabIndex = 0;
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", `${label}. ${translations[document.documentElement.lang || "pl"]?.gallery_open_hint || translations.pl.gallery_open_hint}`);
      });
    }

    function updateModal() {
      const current = images[lightboxIndex];
      const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
      modalImage.src = current.src;
      modalImage.alt = getGalleryImageLabel(current, lightboxIndex);
      modalStatus.textContent = formatMessage(dict.gallery_modal_status, {
        current: lightboxIndex + 1,
        total: images.length
      });
    }

    function trapFocus(event) {
      if (event.key !== "Tab" || modal.hidden) return;
      trapFocusIn(modal, event);
    }

    function openModal(imgIndex, sourceElement = images[imgIndex]) {
      lastFocusedElement = sourceElement;
      lightboxIndex = imgIndex;
      updateModal();
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      modalClose.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    function changeModal(step) {
      lightboxIndex = (lightboxIndex + step + images.length) % images.length;
      updateModal();
    }

    prevButton.addEventListener("click", () => {
      goTo(index - 1);
      startAutoMotion();
    });

    nextButton.addEventListener("click", () => {
      goTo(index + 1);
      startAutoMotion();
    });

    images.forEach((img, imgIndex) => {
      img.addEventListener("click", () => openModal(imgIndex, img));
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal(imgIndex, img);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          const nextIndex = (imgIndex + 1) % images.length;
          goTo(nextIndex > getMaxIndex() ? 0 : nextIndex);
          images[nextIndex].focus();
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          const prevIndex = (imgIndex - 1 + images.length) % images.length;
          goTo(prevIndex > getMaxIndex() ? getMaxIndex() : prevIndex);
          images[prevIndex].focus();
        }
        if (event.key === "Home") {
          event.preventDefault();
          goTo(0);
          images[0].focus();
        }
        if (event.key === "End") {
          event.preventDefault();
          const lastIndex = images.length - 1;
          goTo(getMaxIndex());
          images[lastIndex].focus();
        }
      });
    });

    gallery.addEventListener("mouseenter", stopAutoMotion);
    gallery.addEventListener("mouseleave", startAutoMotion);
    gallery.addEventListener("focusin", stopAutoMotion);
    gallery.addEventListener("focusout", startAutoMotion);

    modalClose.addEventListener("click", closeModal);
    modalPrev.addEventListener("click", () => changeModal(-1));
    modalNext.addEventListener("click", () => changeModal(1));

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") changeModal(-1);
      if (event.key === "ArrowRight") changeModal(1);
      trapFocus(event);
    });

    window.addEventListener("resize", updateGallery);

    refreshImageAccessibility();
    updateGallery();
    startAutoMotion();
    gallery._restartAutoMotion = startAutoMotion;
  }

    const translations = {
      pl: {
        title: "Dom Latarnika – pensjonat nad morzem w Grzybowie",
        description: "Pensjonat Dom Latarnika w Grzybowie – wakacje nad morzem koło Kołobrzegu. Komfortowe pokoje, studia i apartament nad Bałtykiem, wspólna kuchnia, salon i taras, spokojna lokalizacja blisko plaży i wygodna rezerwacja online.",
        skip: "Przejdź do treści",
        a11y_btn_aria: "Ułatwienia dostępności",
        a11y_panel_aria: "Ułatwienia dostępności",
        a11y_close_aria: "Zamknij panel ułatwień",
        a11y_title: "Ułatwienia",
        a11y_text: "Dodatkowe ustawienia dla wygodniejszego korzystania ze strony.",
        a11y_motion: "Mniej ruchu",
        a11y_text_size: "Większy tekst",
        a11y_contrast: "Wyższy kontrast",
        a11y_panel_shown: "Pokazano panel ułatwień.",
        a11y_motion_on: "Włączono ograniczenie ruchu.",
        a11y_motion_off: "Wyłączono ograniczenie ruchu.",
        a11y_text_on: "Włączono większy tekst.",
        a11y_text_off: "Wyłączono większy tekst.",
        a11y_contrast_on: "Włączono wyższy kontrast.",
        a11y_contrast_off: "Wyłączono wyższy kontrast.",
        nav_offer: "O obiekcie",
        nav_rooms: "Pokoje",
        nav_area: "Okolica",
        nav_reviews: "Opinie",
        nav_contact: "Kontakt",
        hero_section_aria: "Zdjęcia pensjonatu",
        brand_home_aria: "Dom Latarnika, przejdź na początek strony",
        social_facebook: "Facebook",
        social_facebook_aria: "Facebook Dom Latarnika",
        nav_main_aria: "Główna nawigacja",
        lang_switcher_aria: "Wybór języka",
        lang_pl_aria: "Język polski",
        lang_de_aria: "Język niemiecki",
        lang_en_aria: "Język angielski",
        footer_nav_aria: "Stopka",
        open_menu_aria: "Otwórz menu",
        close_menu_aria: "Zamknij menu",
        hero_dots_aria: "Wybór slajdu",
        slide_1_aria: "Slajd 1",
        slide_2_aria: "Slajd 2",
        slide_3_aria: "Slajd 3",
        slide_4_aria: "Slajd 4",
        gallery_prev_aria: "Poprzednie zdjęcia",
        gallery_next_aria: "Następne zdjęcia",
        gallery_dialog_aria: "Podgląd zdjęcia",
        gallery_close_aria: "Zamknij podgląd zdjęcia",
        gallery_prev_single_aria: "Poprzednie zdjęcie",
        gallery_next_single_aria: "Następne zdjęcie",
        gallery_image_fallback: "Zdjęcie galerii",
        gallery_open_hint: "Naciśnij Enter, aby otworzyć powiększenie",
        gallery_modal_help: "Użyj klawiszy strzałek, aby zmieniać zdjęcia, i Escape, aby zamknąć podgląd.",
        hero_slide_status: "Slajd {current} z {total}",
        gallery_modal_status: "Zdjęcie {current} z {total}",
        language_changed_status: "Włączono język polski.",
        new_tab_aria: "Otwiera się w nowej karcie",
        reviews_google_link_aria: "Zobacz opinie Google",
        call: "Zadzwoń",
        booking: "Booking.com",
        check_availability: "Sprawdź dostępność",
        navigate: "Nawiguj",
        hero_kicker: "Pensjonat Dom Latarnika · Grzybowo",
        hero_title: "Udane wakacje nad Bałtykiem",
        hero_text: "Spokojny wypoczynek w Grzybowie, blisko morza, z komfortowymi pokojami, studiami i apartamentem oraz wygodną rezerwacją online.",
        panel_title: "Najważniejsze informacje",
        panel_text: "Najważniejsze rzeczy w jednym miejscu, przed planowaniem pobytu.",
        panel_location_label: "Lokalizacja",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Odległość od morza",
        panel_sea_value: "Kilka minut spacerem do plaży.",
        panel_parking_label: "Parking",
        panel_parking_value: "bezpłatny, na miejscu",
        panel_booking_label: "Rezerwacja",
        panel_booking_value: "online lub telefonicznie",
        usp_kicker: "Dlaczego warto",
        usp_title: "Spokojny wypoczynek blisko morza",
        usp_text: "Wygodne wnętrza, kameralna atmosfera i wszystko, czego potrzeba do udanego pobytu.",
        usp1_title: "Rodzinnie",
        usp1_text: "Komfortowe pokoje i spokojna okolica sprzyjają wypoczynkowi z dziećmi.",
        usp2_title: "Grupowo",
        usp2_text: "Dobre rozwiązanie dla grup, wyjazdów integracyjnych i dłuższych pobytów.",
        usp3_title: "Nad morzem",
        usp3_text: "Bliskość plaży i nadmorski klimat tworzą idealne warunki do odpoczynku.",
        offer_kicker: "O obiekcie",
        offer_title: "Wygodnie, spokojnie, blisko morza",
        offer_text1: "Kameralny obiekt w spokojnej części Grzybowa, w bliskim sąsiedztwie plaży i tras spacerowych, a jednocześnie z dala od zgiełku.",
        offer_text2: "Na gości czekają pokoje, studia i apartament z własnymi łazienkami, praktyczne wyposażenie oraz udogodnienia przydatne podczas dłuższego pobytu.",
        offer_item1: "Kilka minut spacerem do plaży",
        offer_item2: "Pokoje, studia i apartament z łazienkami",
        offer_item3: "Aneks kuchenny, sprzęt plażowy, rowery i pralnia",
        offer_item4: "Zamknięty, monitorowany parking na miejscu",
        area_kicker: "Okolica",
        area_title: "Grzybowo i dojazd",
        area_text: "Grzybowo to spokojna nadmorska miejscowość, idealna na plażowanie, spacery i rodzinne wycieczki rowerowe. Dom Latarnika znajduje się blisko plaży, a okolica pozwala wygodnie odpoczywać i odkrywać wybrzeże w spokojnym tempie.",
        area_map_alt: "Stylizowana mapa Grzybowa, Dźwirzyna i Kołobrzegu",
        area_badge_score: "4,6/5",
        area_badge_label: "Spokojna okolica",
        area_score_button_aria: "Pokaż informacje o spokojnej okolicy",
        area_item1_title: "Plaża i atrakcje",
        area_item1_text: "Szeroka plaża, spacery i nadmorskie atrakcje w okolicy.",
        area_item1_button: "Zobacz atrakcje",
        area_item2_title: "Trasy rowerowe",
        area_item2_text: "Rodzinne przejażdżki i ciekawe trasy w stronę Kołobrzegu oraz Dźwirzyna.",
        area_item2_button: "Zobacz trasy",
        area_item3_title: "Transport i dojazd",
        area_item3_text: "Sprawdź trasę do Domu Latarnika i wygodnie zaplanuj dojazd.",
        area_item3_button: "Sprawdź dojazd",
        area_modal_close_aria: "Zamknij okno sekcji okolicy",
        area_score_modal_aria: "Spokojna okolica",
        area_score_modal_title: "Spokojna okolica",
        area_score_modal_text: "Ocena lokalizacji 4,6 podkreśla spokojny charakter Grzybowa i wygodne położenie Domu Latarnika. Obiekt znajduje się w cichej części miejscowości, blisko plaży, tras spacerowych i rowerowych, a jednocześnie z dogodnym dojazdem do Kołobrzegu.",
        area_score_point1: "spokojna część Grzybowa,",
        area_score_point2: "blisko do plaży,",
        area_score_point3: "trasy spacerowe i rowerowe w okolicy,",
        area_score_point4: "wygodny dojazd do Kołobrzegu,",
        area_score_point5: "dobra lokalizacja na rodzinny wypoczynek.",
        area_beach_modal_aria: "Plaża i atrakcje",
        area_beach_modal_title: "Plaża i atrakcje",
        area_beach_modal_text: "Plaża, spacery i atrakcje w okolicy — wszystko blisko Domu Latarnika.",
        area_beach_modal_button: "Pokaż na mapie",
        area_beach_card1_title: "Plaża w Grzybowie",
        area_beach_card1_subtitle: "około 500 m od obiektu",
        area_beach_card2_title: "Nadmorskie spacery",
        area_beach_card2_subtitle: "spokojne trasy przy plaży",
        area_beach_card3_title: "Kołobrzeg i okolica",
        area_beach_card3_subtitle: "atrakcje kilka minut dalej",
        rooms_kicker: "Pokoje",
        rooms_title: "Znajdź swój ulubiony pokój",
        rooms_text: "Nasze pokoje pogrupowaliśmy w kilka kategorii z charakterem — od prywatnego zacisza, przez pokoje na poddaszu, po łączonego „Bliźniaka” i apartament. Kliknij kategorię, aby zobaczyć zdjęcia i wyposażenie.",
        rooms_note: "Dostępność i aktualne ceny wszystkich pokoi znajdziesz na Booking.com.",
        rooms_note_button: "Zobacz dostępność",
        room_details: "Szczegóły",
        room_equipment: "Wyposażenie",
        gallery_section_aria: "Galeria zdjęć obiektu",
        room_modal_aria: "Szczegóły pokoju",
        room_modal_close_aria: "Zamknij okno pokoju",
        room_photos_soon: "Zdjęcia wkrótce",
        room_names_label: "Pokoje w tej kategorii",
        room_filters_aria: "Filtry pokoi",
        room_filter_all: "Wszystkie",
        room_filter_two: "2 osoby",
        room_filter_family: "Rodzina",
        room_filter_attic: "Poddasze",
        room_filter_balcony: "Balkon",
        room_filter_kitchenette: "Aneks",
        room_no_results: "Brak pokoi dla wybranego filtra.",
        room_meta_capacity: "Liczba osób",
        room_meta_beds: "Łóżka",
        room_meta_floor: "Poziom",
        room_meta_layout: "Balkon / aneks",
        room_meta_best_for: "Najlepiej dla",
        room_capacity_solo: "1 osoba",
        room_capacity_one_two: "1-2 osoby",
        room_capacity_two_four: "2-4 osoby",
        room_capacity_two: "2 osoby",
        room_capacity_three_five: "3-5 osób",
        room_capacity_four_six: "4-6 osób",
        room_beds_single: "pojedyncze łóżko",
        room_beds_double: "łóżko podwójne",
        room_beds_flexible: "układ zależny od pokoju",
        room_beds_two_rooms: "dwa oddzielne pokoje",
        room_beds_two_bedrooms: "dwie sypialnie + salon",
        room_floor_separate: "osobna, spokojna część",
        room_floor_few_steps: "kilka schodków wyżej",
        room_floor_main: "główna część obiektu",
        room_floor_attic: "poddasze",
        room_floor_connected: "część łączona",
        room_floor_private: "osobne wejście",
        room_layout_basic: "bez aneksu i balkonu",
        room_layout_balcony: "balkon",
        room_layout_kitchenette: "aneks kuchenny",
        room_layout_full_kitchen: "salon z aneksem",
        room_best_solo: "solo i spokojnego pobytu",
        room_best_couples: "par i krótszych pobytów",
        room_best_couples_family: "par i rodzin",
        room_best_attic: "par lub spokojnego wypoczynku",
        room_best_large_family: "większej rodziny",
        room_best_long_family: "rodzin i dłuższych pobytów",
        rg_priv_tag: "Prywatny · 1 osoba",
        rg_priv_title: "Pokój „0” — prywatne zacisze",
        rg_priv_desc: "W pełni prywatny pokój, oddzielony od reszty obiektu, z myślą o jednej osobie. Maksimum spokoju i niezależności.",
        rg_stairs_tag: "2 pokoje · kilka schodków",
        rg_stairs_title: "Pokoje „DO” i „DU”",
        rg_stairs_desc: "Do tych dwóch pokoi wchodzi się kilka (5) schodków wyżej — dzięki temu dają miłe poczucie odosobnienia.",
        rg_std_tag: "6 pokoi",
        rg_std_title: "Pokoje 1h–6h",
        rg_std_desc: "Wygodne, jasne pokoje z własną łazienką — sprawdzą się dla par i rodzin. Do wyboru sześć numerów.",
        rg_attic_tag: "2 pokoje · poddasze",
        rg_attic_title: "Na poddaszu — 7h i 8h",
        rg_attic_desc: "Kameralne pokoje pod skosami, na poddaszu — z przytulnym, wakacyjnym klimatem.",
        rg_join_tag: "Łączone · Bliźniak",
        rg_join_title: "„R”, „Piętrus” i „Bliźniak”",
        rg_join_desc: "„R” to ulubiony pokój właściciela — o powód dopytaj na miejscu 😉. Razem z „Piętrusem” tworzą „Bliźniaka”: dwa oddzielne pokoje połączone w jeden, idealne dla większej rodziny.",
        rg_apart_tag: "Apartament",
        rg_apart_title: "Apartament",
        rg_apart_desc: "Najwięcej przestrzeni: osobne sypialnie, salon z aneksem kuchennym i własne wejście.",
        feat_bath: "Własna łazienka (prysznic, WC)",
        feat_tv: "Telewizor",
        feat_fridge: "Lodówka",
        feat_kettle: "Czajnik",
        feat_safe: "Szafa z sejfem",
        feat_wifi: "Bezpłatne WiFi",
        feat_kitchenette: "Aneks kuchenny",
        feat_balcony: "Balkon",
        feat_premium: "Podwyższony standard",
        feat_two_bedrooms: "Dwie sypialnie",
        feat_kitchen_full: "Pełny aneks kuchenny z AGD",
        feat_living: "Oddzielny salon",
        feat_private_entrance: "Osobne wejście",
        amenities_kicker: "Udogodnienia",
        amenities_title: "Wygody w cenie pobytu",
        amenities_bath: "W każdym pokoju własna łazienka",
        spaces_kicker: "Wspólne przestrzenie",
        spaces_title: "Miejsca, które łączą gości",
        spaces_text: "Poza własnym pokojem czekają na Ciebie wspólne przestrzenie — do gotowania, wspólnej gry i odpoczynku na świeżym powietrzu.",
        shared_media_soon: "Zdjęcia i nagrania wkrótce",
        shared_kitchen_title: "Wspólna kuchnia",
        shared_kitchen_text: "W pełni wyposażona, dodatkowa kuchnia dostępna dla gości — wygodna zwłaszcza przy dłuższych pobytach.",
        shared_kitchen_tag: "Do dyspozycji gości",
        shared_salon_title: "Salon z grami",
        shared_salon_text: "Przytulny salon z dodatkowym telewizorem i pokaźnym wyborem gier planszowych — idealny na wieczory z rodziną i znajomymi.",
        shared_salon_tag: "TV i gry planszowe",
        shared_terrace_title: "Wspólny taras",
        shared_terrace_text: "Zaciszny taras przy budynku — dobre miejsce na poranną kawę i wieczorny relaks po dniu na plaży.",
        shared_terrace_tag: "Strefa relaksu",
        am_wifi: "Bezpłatne WiFi",
        am_parking: "Zamknięty parking",
        am_monitoring: "Monitoring całodobowy",
        am_bikes: "Wypożyczalnia rowerów",
        am_beach_gear: "Sprzęt plażowy",
        am_laundry: "Pralnia",
        am_grill: "Grill i miejsce na ognisko",
        am_kitchenette: "Dostęp do kuchni",
        am_terrace: "Taras",
        am_playground: "Teren zielony dla dzieci",
        am_linen: "Pościel i ręczniki",
        am_safe: "Sejf w pokoju",
        news_kicker: "Aktualności",
        news_title: "Co słychać w Domu Latarnika",
        news_text: "Najnowsze zdjęcia, wolne terminy i promocje publikujemy na naszym Facebooku. Zajrzyj i bądź na bieżąco przed sezonem.",
        news_tag_photo: "Zdjęcia",
        news_tag_offer: "Terminy",
        news_card1_title: "Nowe zdjęcia z sezonu",
        news_card1_text: "Zajrzyj na naszą galerię na Facebooku — dodajemy zdjęcia pokoi, plaży i okolicy.",
        news_card2_title: "Wolne terminy i promocje",
        news_card2_text: "O ostatnich wolnych terminach i ofertach specjalnych informujemy na bieżąco w social mediach.",
        news_card3_title: "Śledź nas na Facebooku",
        news_card3_text: "Codzienne aktualności, zdjęcia i szybki kontakt przez Messenger.",
        news_card3_button: "Odwiedź profil",
        fb_embed_title: "Tablica na Facebooku",
        fb_embed_text: "Aby wyświetlić naszą tablicę Facebooka bezpośrednio na stronie, zaakceptuj cookies społecznościowe.",
        fb_embed_load: "Pokaż tablicę",
        fb_embed_open: "Otwórz w nowej karcie",
        fb_embed_fallback: "Nie widać tablicy? Otwórz nasz profil na Facebooku",
        fb_embed_blocked: "Twoja przeglądarka lub rozszerzenie zablokowały osadzoną tablicę. Otwórz nasz profil bezpośrednio na Facebooku.",
        nav_spaces: "Przestrzenie",
        nav_amenities: "Udogodnienia",
        nav_news: "Aktualności",
        hero_rooms_btn: "Zobacz pokoje",
        hero_scroll_aria: "Przewiń w dół",
        stats_aria: "Dom Latarnika w liczbach",
        stats_rooms: "pokoi i studiów",
        stats_beach_num: "5 min",
        stats_beach: "do plaży",
        privacy: "Polityka prywatności",
        cookie_text: "Używamy cookies do analizy ruchu i treści społecznościowych (np. tablica Facebooka).",
        cookie_decline: "Odrzuć",
        cookie_accept: "Zaakceptuj",
        reviews_kicker: "Opinie",
        reviews_title: "Opinie, które budują zaufanie",
        reviews_text: "Wysokie oceny w Booking.com i dobre opinie w Google potwierdzają spokojny charakter pobytu oraz jakość obsługi.",
        reviews_booking_label: "Wyjątkowy",
        reviews_booking_count: "39 opinii",
        reviews_booking_desc: "Goście szczególnie doceniają lokalizację, spokojną atmosferę i komfort pobytu.",
        reviews_booking_meta1: "Lokalizacja 9,9",
        reviews_google_title: "Google",
        reviews_google_scoreline: "4,5 / 5",
        reviews_google_desc: "Goście chętnie wracają za kameralną atmosferę, wygodę i bliskość morza.",
        reviews_google_count: "177 opinii",
        reviews_open_button: "Sprawdź opinie",
        reviews_summary_title: "Najczęściej chwalone",
        reviews_summary_text: "Lokalizacja, czystość, spokojna okolica i przyjazna atmosfera pobytu.",
        contact_kicker: "Kontakt i rezerwacja",
        contact_title: "Zaplanuj swój pobyt",
        contact_text: "Skontaktuj się z nami telefonicznie, sprawdź dostępność online lub zobacz najważniejsze informacje dotyczące pobytu.",
        contact_booking_title: "Kontakt i rezerwacja",
        contact_booking_text: "Zadzwoń do nas lub sprawdź dostępność online. Chętnie odpowiemy na pytania dotyczące pobytu i rezerwacji.",
        contact_booking_button: "Zarezerwuj pobyt",
        booking_modal_aria: "Kontakt i rezerwacja",
        booking_modal_close_aria: "Zamknij okno rezerwacji",
        book_online: "Zarezerwuj online",
        contact_payment_title: "Pobyt i płatności",
        contact_payment_text: "Doba hotelowa, zadatek oraz dane potrzebne do rezerwacji bezpośredniej.",
        contact_address_title: "Adres i dojazd",
        contact_address_text: "Zobacz lokalizację obiektu i uruchom nawigację do Domu Latarnika.",
        details_show: "Szczegóły",
        details_hide: "Szczegóły",
        payment_open_button: "Dane do przelewu",
        payment_modal_title: "Dane do przelewu",
        payment_modal_aria: "Dane do przelewu",
        payment_modal_close_aria: "Zamknij okno z danymi do przelewu",
        payment_line1: "Doba hotelowa trwa od 15:00 do 10:00.",
        payment_line2: "Przy rezerwacji bezpośredniej pobierany jest zadatek w wysokości 30% wartości pobytu.",
        payment_line3: "Opłata klimatyczna nie jest wliczona w cenę pobytu.",
        payment_bank_title: "Dane do przelewu",
        payment_recipient_label: "Odbiorca:",
        payment_recipient_value: "Dom Latarnika",
        payment_account_label: "Numer rachunku:",
        payment_transfer_label: "Tytuł przelewu:",
        payment_transfer_value: "Zadatek — imię i nazwisko, termin pobytu",
        payment_example_label: "Przykład:",
        payment_example_value: "Zadatek — Anna Kowalska, 12–18.07.2026",
        footer_title: "Dom Latarnika",
        footer_text: "Grzybowo · ul. Nadmorska 65A",
        footer_seo: "Wakacje nad morzem w Grzybowie – noclegi nad polskim morzem blisko Kołobrzegu, Dźwirzyna i Bałtyku.",
        rules: "Regulamin"
      },
      de: {
        title: "Dom Latarnika - ruhiger Aufenthalt am Meer in Grzybowo",
        description: "Dom Latarnika in Grzybowo – Urlaub an der Ostsee nahe Kolberg (Kołobrzeg). Komfortable Zimmer, Studios und Apartment, Gemeinschaftsküche, Wohnzimmer und Terrasse, ruhige Lage nahe am Meer und bequeme Online-Buchung.",
        skip: "Zum Inhalt",
        a11y_btn_aria: "Barrierefreiheit",
        a11y_panel_aria: "Barrierefreiheitshilfen",
        a11y_close_aria: "Hilfepanel schließen",
        a11y_title: "Hilfen",
        a11y_text: "Zusätzliche Einstellungen für eine bequemere Nutzung der Website.",
        a11y_motion: "Weniger Bewegung",
        a11y_text_size: "Größerer Text",
        a11y_contrast: "Höherer Kontrast",
        a11y_panel_shown: "Hilfepanel wurde eingeblendet.",
        a11y_motion_on: "Bewegungsreduzierung aktiviert.",
        a11y_motion_off: "Bewegungsreduzierung deaktiviert.",
        a11y_text_on: "Größerer Text aktiviert.",
        a11y_text_off: "Größerer Text deaktiviert.",
        a11y_contrast_on: "Höherer Kontrast aktiviert.",
        a11y_contrast_off: "Höherer Kontrast deaktiviert.",
        nav_offer: "Über das Haus",
        nav_rooms: "Zimmer",
        nav_area: "Umgebung",
        nav_reviews: "Bewertungen",
        nav_contact: "Kontakt",
        hero_section_aria: "Fotos der Pension",
        brand_home_aria: "Dom Latarnika, zum Seitenanfang",
        social_facebook: "Facebook",
        social_facebook_aria: "Facebook von Dom Latarnika",
        nav_main_aria: "Hauptnavigation",
        lang_switcher_aria: "Sprachauswahl",
        lang_pl_aria: "Polnische Sprache",
        lang_de_aria: "Deutsche Sprache",
        lang_en_aria: "Englische Sprache",
        footer_nav_aria: "Fußzeile",
        open_menu_aria: "Menü öffnen",
        close_menu_aria: "Menü schließen",
        hero_dots_aria: "Folienauswahl",
        slide_1_aria: "Folie 1",
        slide_2_aria: "Folie 2",
        slide_3_aria: "Folie 3",
        slide_4_aria: "Folie 4",
        gallery_prev_aria: "Vorherige Bilder",
        gallery_next_aria: "Nächste Bilder",
        gallery_dialog_aria: "Bildansicht",
        gallery_close_aria: "Bildansicht schließen",
        gallery_prev_single_aria: "Vorheriges Bild",
        gallery_next_single_aria: "Nächstes Bild",
        gallery_image_fallback: "Galeriebild",
        gallery_open_hint: "Zum Öffnen der Vergrößerung Enter drücken",
        gallery_modal_help: "Verwende die Pfeiltasten, um die Bilder zu wechseln, und Escape, um die Ansicht zu schließen.",
        hero_slide_status: "Folie {current} von {total}",
        gallery_modal_status: "Bild {current} von {total}",
        language_changed_status: "Deutsche Sprache aktiviert.",
        new_tab_aria: "Wird in einem neuen Tab geöffnet",
        reviews_google_link_aria: "Google-Bewertungen ansehen",
        call: "Anrufen",
        booking: "Booking.com",
        check_availability: "Verfügbarkeit prüfen",
        navigate: "Navigation",
        hero_kicker: "Pension Dom Latarnika · Grzybowo",
        hero_title: "Gelungener Urlaub an der Ostsee",
        hero_text: "Erholsame Tage in Grzybowo, nahe am Meer, mit komfortablen Zimmern, Studios und einem Apartment sowie bequemer Online-Buchung.",
        panel_title: "Wichtige Informationen",
        panel_text: "Die wichtigsten Punkte an einem Ort, noch vor der Planung des Aufenthalts.",
        panel_location_label: "Lage",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Entfernung zum Meer",
        panel_sea_value: "Wenige Gehminuten zum Strand.",
        panel_parking_label: "Parkplatz",
        panel_parking_value: "kostenlos, vor Ort",
        panel_booking_label: "Buchung",
        panel_booking_value: "online oder telefonisch",
        usp_kicker: "Warum es sich lohnt",
        usp_title: "Ruhige Erholung in Meeresnähe",
        usp_text: "Angenehme Innenräume, persönliche Atmosphäre und alles, was man für einen gelungenen Aufenthalt braucht.",
        usp1_title: "Mit der Familie",
        usp1_text: "Komfortable Zimmer und eine ruhige Umgebung fördern entspannte Tage mit Kindern.",
        usp2_title: "Für Gruppen",
        usp2_text: "Eine gute Lösung für Gruppen, gemeinsame Reisen und längere Aufenthalte.",
        usp3_title: "Am Meer",
        usp3_text: "Die Nähe zum Strand und das Küstenklima schaffen ideale Bedingungen für Erholung.",
        offer_kicker: "Über das Haus",
        offer_title: "Komfortabel, ruhig, nah am Meer",
        offer_text1: "Ein kleines Haus in einem ruhigen Teil von Grzybowo, in der Nähe von Strand und Spazierwegen und zugleich abseits des Trubels.",
        offer_text2: "Auf die Gäste warten Zimmer, Studios und ein Apartment mit eigenem Bad, praktische Ausstattung und Annehmlichkeiten, die bei längeren Aufenthalten besonders nützlich sind.",
        offer_item1: "Wenige Gehminuten zum Strand",
        offer_item2: "Zimmer, Studios und Apartment mit Bad",
        offer_item3: "Küchenzeile, Strandausrüstung, Fahrräder und Waschraum",
        offer_item4: "Abgeschlossener, überwachter Parkplatz vor Ort",
        area_kicker: "Umgebung",
        area_title: "Grzybowo und Anreise",
        area_text: "Grzybowo ist ein ruhiger Küstenort, ideal für Strand, Spaziergänge und Fahrradausflüge mit der Familie. Dom Latarnika liegt nah am Strand und die Umgebung lädt dazu ein, die Küste entspannt zu entdecken.",
        area_map_alt: "Stilisierte Karte von Grzybowo, Dźwirzyno und Kołobrzeg",
        area_badge_score: "4,6/5",
        area_badge_label: "Ruhige Umgebung",
        area_score_button_aria: "Informationen zur ruhigen Umgebung anzeigen",
        area_item1_title: "Strand und Attraktionen",
        area_item1_text: "Breiter Strand, Spaziergänge und Attraktionen am Meer in der Umgebung.",
        area_item1_button: "Attraktionen ansehen",
        area_item2_title: "Radwege",
        area_item2_text: "Familienfahrten und schöne Routen in Richtung Kołobrzeg und Dźwirzyno.",
        area_item2_button: "Radwege ansehen",
        area_item3_title: "Transport und Anreise",
        area_item3_text: "Prüfen Sie die Route zum Dom Latarnika und planen Sie die Anreise bequem.",
        area_item3_button: "Anreise prüfen",
        area_modal_close_aria: "Fenster der Umgebung schließen",
        area_score_modal_aria: "Ruhige Umgebung",
        area_score_modal_title: "Ruhige Umgebung",
        area_score_modal_text: "Die Lagebewertung 4,6 unterstreicht den ruhigen Charakter von Grzybowo und die günstige Lage des Dom Latarnika. Das Haus liegt in einem stillen Teil des Ortes, nah am Strand sowie an Spazier- und Radwegen und zugleich mit bequemer Verbindung nach Kołobrzeg.",
        area_score_point1: "ruhiger Teil von Grzybowo,",
        area_score_point2: "nah am Strand,",
        area_score_point3: "Spazier- und Radwege in der Umgebung,",
        area_score_point4: "bequeme Verbindung nach Kołobrzeg,",
        area_score_point5: "gute Lage für Familienerholung.",
        area_beach_modal_aria: "Strand und Attraktionen",
        area_beach_modal_title: "Strand und Attraktionen",
        area_beach_modal_text: "Strand, Spaziergänge und Attraktionen in der Umgebung — alles nah am Dom Latarnika.",
        area_beach_modal_button: "Auf der Karte zeigen",
        area_beach_card1_title: "Strand in Grzybowo",
        area_beach_card1_subtitle: "etwa 500 m vom Haus entfernt",
        area_beach_card2_title: "Spaziergänge am Meer",
        area_beach_card2_subtitle: "ruhige Wege am Strand",
        area_beach_card3_title: "Kołobrzeg und Umgebung",
        area_beach_card3_subtitle: "Attraktionen nur wenige Minuten entfernt",
        rooms_kicker: "Zimmer",
        rooms_title: "Finden Sie Ihr Lieblingszimmer",
        rooms_text: "Unsere Zimmer haben wir in einige Kategorien mit Charakter gruppiert — vom privaten Rückzugsort über Zimmer im Dachgeschoss bis zum verbundenen „Bliźniak” und dem Apartment. Klicken Sie auf eine Kategorie, um Fotos und Ausstattung zu sehen.",
        rooms_note: "Verfügbarkeit und aktuelle Preise aller Zimmer finden Sie auf Booking.com.",
        rooms_note_button: "Verfügbarkeit ansehen",
        room_details: "Details",
        room_equipment: "Ausstattung",
        gallery_section_aria: "Fotogalerie des Objekts",
        room_modal_aria: "Zimmerdetails",
        room_modal_close_aria: "Zimmerfenster schließen",
        room_photos_soon: "Fotos folgen in Kürze",
        room_names_label: "Zimmer in dieser Kategorie",
        room_filters_aria: "Zimmerfilter",
        room_filter_all: "Alle",
        room_filter_two: "2 Personen",
        room_filter_family: "Familie",
        room_filter_attic: "Dachgeschoss",
        room_filter_balcony: "Balkon",
        room_filter_kitchenette: "Küchenzeile",
        room_no_results: "Keine Zimmer für diesen Filter.",
        room_meta_capacity: "Personen",
        room_meta_beds: "Betten",
        room_meta_floor: "Etage",
        room_meta_layout: "Balkon / Küche",
        room_meta_best_for: "Am besten für",
        room_capacity_solo: "1 Person",
        room_capacity_one_two: "1-2 Personen",
        room_capacity_two_four: "2-4 Personen",
        room_capacity_two: "2 Personen",
        room_capacity_three_five: "3-5 Personen",
        room_capacity_four_six: "4-6 Personen",
        room_beds_single: "Einzelbett",
        room_beds_double: "Doppelbett",
        room_beds_flexible: "je nach Zimmer",
        room_beds_two_rooms: "zwei separate Zimmer",
        room_beds_two_bedrooms: "zwei Schlafzimmer + Wohnzimmer",
        room_floor_separate: "separater ruhiger Bereich",
        room_floor_few_steps: "ein paar Stufen höher",
        room_floor_main: "Hauptteil des Hauses",
        room_floor_attic: "Dachgeschoss",
        room_floor_connected: "verbundener Bereich",
        room_floor_private: "separater Eingang",
        room_layout_basic: "ohne Küchenzeile und Balkon",
        room_layout_balcony: "Balkon",
        room_layout_kitchenette: "Küchenzeile",
        room_layout_full_kitchen: "Wohnzimmer mit Küchenzeile",
        room_best_solo: "Alleinreisende und ruhige Aufenthalte",
        room_best_couples: "Paare und kurze Aufenthalte",
        room_best_couples_family: "Paare und Familien",
        room_best_attic: "Paare oder ruhige Erholung",
        room_best_large_family: "größere Familien",
        room_best_long_family: "Familien und längere Aufenthalte",
        rg_priv_tag: "Privat · 1 Person",
        rg_priv_title: "Zimmer „0” — privater Rückzugsort",
        rg_priv_desc: "Ein komplett privates Zimmer, getrennt vom Rest des Hauses, für eine Person. Maximale Ruhe und Unabhängigkeit.",
        rg_stairs_tag: "2 Zimmer · ein paar Stufen",
        rg_stairs_title: "Zimmer „DO” und „DU”",
        rg_stairs_desc: "Zu diesen beiden Zimmern gelangt man ein paar (5) Stufen höher — das gibt ein angenehmes Gefühl der Abgeschiedenheit.",
        rg_std_tag: "6 Zimmer",
        rg_std_title: "Zimmer 1h–6h",
        rg_std_desc: "Bequeme, helle Zimmer mit eigenem Bad — ideal für Paare und Familien. Sechs Nummern zur Auswahl.",
        rg_attic_tag: "2 Zimmer · Dachgeschoss",
        rg_attic_title: "Im Dachgeschoss — 7h und 8h",
        rg_attic_desc: "Gemütliche Zimmer unter Dachschrägen — mit heimeligem Urlaubsflair.",
        rg_join_tag: "Verbunden · Bliźniak",
        rg_join_title: "„R”, „Piętrus” und „Bliźniak”",
        rg_join_desc: "„R” ist das Lieblingszimmer des Gastgebers — nach dem Grund fragen Sie am besten vor Ort 😉. Zusammen mit „Piętrus” bilden sie „Bliźniak”: zwei separate Zimmer, zu einem verbunden — ideal für größere Familien.",
        rg_apart_tag: "Apartment",
        rg_apart_title: "Apartment",
        rg_apart_desc: "Am meisten Platz: separate Schlafzimmer, Wohnzimmer mit Küchenzeile und eigener Eingang.",
        feat_bath: "Eigenes Bad (Dusche, WC)",
        feat_tv: "Fernseher",
        feat_fridge: "Kühlschrank",
        feat_kettle: "Wasserkocher",
        feat_safe: "Schrank mit Safe",
        feat_wifi: "Kostenloses WLAN",
        feat_kitchenette: "Küchenzeile",
        feat_balcony: "Balkon",
        feat_premium: "Gehobener Standard",
        feat_two_bedrooms: "Zwei Schlafzimmer",
        feat_kitchen_full: "Voll ausgestattete Küchenzeile",
        feat_living: "Separates Wohnzimmer",
        feat_private_entrance: "Separater Eingang",
        amenities_kicker: "Ausstattung",
        amenities_title: "Komfort im Preis inbegriffen",
        amenities_bath: "In jedem Zimmer ein eigenes Bad",
        spaces_kicker: "Gemeinschaftsbereiche",
        spaces_title: "Orte, die Gäste verbinden",
        spaces_text: "Neben dem eigenen Zimmer warten Gemeinschaftsbereiche auf Sie — zum Kochen, gemeinsamen Spielen und Entspannen an der frischen Luft.",
        shared_media_soon: "Fotos und Videos folgen in Kürze",
        shared_kitchen_title: "Gemeinschaftsküche",
        shared_kitchen_text: "Voll ausgestattete zusätzliche Küche für Gäste — besonders praktisch bei längeren Aufenthalten.",
        shared_kitchen_tag: "Für Gäste verfügbar",
        shared_salon_title: "Wohnzimmer mit Spielen",
        shared_salon_text: "Gemütliches Wohnzimmer mit zusätzlichem Fernseher und einer großen Auswahl an Brettspielen — ideal für Abende mit Familie und Freunden.",
        shared_salon_tag: "TV und Brettspiele",
        shared_terrace_title: "Gemeinsame Terrasse",
        shared_terrace_text: "Ruhige Terrasse am Haus — ein guter Platz für den Morgenkaffee und die Entspannung am Abend nach einem Tag am Strand.",
        shared_terrace_tag: "Entspannungsbereich",
        am_wifi: "Kostenloses WLAN",
        am_parking: "Abgeschlossener Parkplatz",
        am_monitoring: "24-Stunden-Überwachung",
        am_bikes: "Fahrradverleih",
        am_beach_gear: "Strandausrüstung",
        am_laundry: "Waschraum",
        am_grill: "Grill- und Lagerfeuerplatz",
        am_kitchenette: "Küchennutzung",
        am_terrace: "Terrasse",
        am_playground: "Grünfläche für Kinder",
        am_linen: "Bettwäsche und Handtücher",
        am_safe: "Safe im Zimmer",
        news_kicker: "Aktuelles",
        news_title: "Neues aus dem Dom Latarnika",
        news_text: "Die neuesten Fotos, freien Termine und Angebote veröffentlichen wir auf unserem Facebook. Schauen Sie vorbei und bleiben Sie vor der Saison auf dem Laufenden.",
        news_tag_photo: "Fotos",
        news_tag_offer: "Termine",
        news_card1_title: "Neue Fotos aus der Saison",
        news_card1_text: "Schauen Sie in unsere Facebook-Galerie — wir fügen Fotos von Zimmern, Strand und Umgebung hinzu.",
        news_card2_title: "Freie Termine und Angebote",
        news_card2_text: "Über die letzten freien Termine und Sonderangebote informieren wir laufend in den sozialen Medien.",
        news_card3_title: "Folgen Sie uns auf Facebook",
        news_card3_text: "Tägliche Neuigkeiten, Fotos und schneller Kontakt über Messenger.",
        news_card3_button: "Profil besuchen",
        fb_embed_title: "Facebook-Pinnwand",
        fb_embed_text: "Um unsere Facebook-Pinnwand direkt auf der Seite anzuzeigen, akzeptieren Sie bitte die Social-Media-Cookies.",
        fb_embed_load: "Pinnwand anzeigen",
        fb_embed_open: "In neuem Tab öffnen",
        fb_embed_fallback: "Pinnwand nicht sichtbar? Öffnen Sie unser Facebook-Profil",
        fb_embed_blocked: "Ihr Browser oder eine Erweiterung hat die eingebettete Pinnwand blockiert. Öffnen Sie unser Profil direkt auf Facebook.",
        nav_spaces: "Bereiche",
        nav_amenities: "Ausstattung",
        nav_news: "Aktuelles",
        hero_rooms_btn: "Zimmer ansehen",
        hero_scroll_aria: "Nach unten scrollen",
        stats_aria: "Dom Latarnika in Zahlen",
        stats_rooms: "Zimmer & Studios",
        stats_beach_num: "5 Min.",
        stats_beach: "zum Strand",
        privacy: "Datenschutz",
        cookie_text: "Wir verwenden Cookies zur Verkehrsanalyse und für Social-Media-Inhalte (z. B. Facebook-Pinnwand).",
        cookie_decline: "Ablehnen",
        cookie_accept: "Akzeptieren",
        reviews_kicker: "Bewertungen",
        reviews_title: "Bewertungen, die Vertrauen schaffen",
        reviews_text: "Die hohen Bewertungen bei Booking.com und die guten Google-Meinungen bestätigen den ruhigen Charakter des Aufenthalts und die Qualität des Service.",
        reviews_booking_label: "Außergewöhnlich",
        reviews_booking_count: "39 Bewertungen",
        reviews_booking_desc: "Gäste schätzen besonders die Lage, die ruhige Atmosphäre und den Komfort des Aufenthalts.",
        reviews_booking_meta1: "Lage 9,9",
        reviews_google_title: "Google",
        reviews_google_scoreline: "4,5 / 5",
        reviews_google_desc: "Gäste kommen gern zurück wegen der persönlichen Atmosphäre, des Komforts und der Nähe zum Meer.",
        reviews_google_count: "177 Bewertungen",
        reviews_open_button: "Bewertungen ansehen",
        reviews_summary_title: "Am häufigsten gelobt",
        reviews_summary_text: "Lage, Sauberkeit, ruhige Umgebung und freundliche Atmosphäre.",
        contact_kicker: "Kontakt und Buchung",
        contact_title: "Planen Sie Ihren Aufenthalt",
        contact_text: "Kontaktieren Sie uns telefonisch, prüfen Sie die Verfügbarkeit online oder sehen Sie die wichtigsten Informationen zum Aufenthalt.",
        contact_booking_title: "Kontakt und Buchung",
        contact_booking_text: "Rufen Sie uns an oder prüfen Sie die Verfügbarkeit online. Gern beantworten wir Fragen zu Aufenthalt und Reservierung.",
        contact_booking_button: "Aufenthalt buchen",
        booking_modal_aria: "Kontakt und Buchung",
        booking_modal_close_aria: "Reservierungsfenster schließen",
        book_online: "Online buchen",
        contact_payment_title: "Aufenthalt und Zahlung",
        contact_payment_text: "Hotelzeit, Anzahlung und die Angaben für eine direkte Reservierung.",
        contact_address_title: "Adresse und Anfahrt",
        contact_address_text: "Sehen Sie den Standort des Hauses und starten Sie die Navigation zu Dom Latarnika.",
        details_show: "Details",
        details_hide: "Details",
        payment_open_button: "Überweisungsdaten",
        payment_modal_title: "Überweisungsdaten",
        payment_modal_aria: "Überweisungsdaten",
        payment_modal_close_aria: "Fenster mit Überweisungsdaten schließen",
        payment_line1: "Die Hotelzeit dauert von 15:00 bis 10:00 Uhr.",
        payment_line2: "Bei einer Direktbuchung wird eine Anzahlung in Höhe von 30% des Aufenthaltswertes erhoben.",
        payment_line3: "Die Kurtaxe ist nicht im Aufenthaltspreis enthalten.",
        payment_bank_title: "Überweisungsdaten",
        payment_recipient_label: "Empfänger:",
        payment_recipient_value: "Dom Latarnika",
        payment_account_label: "Kontonummer:",
        payment_transfer_label: "Verwendungszweck:",
        payment_transfer_value: "Anzahlung — Vorname und Nachname, Aufenthaltsdatum",
        payment_example_label: "Beispiel:",
        payment_example_value: "Anzahlung — Anna Kowalska, 12.–18.07.2026",
        footer_title: "Dom Latarnika",
        footer_text: "Grzybowo · ul. Nadmorska 65A",
        footer_seo: "Urlaub an der Ostsee in Grzybowo – Unterkünfte am polnischen Meer nahe Kolberg (Kołobrzeg), Dźwirzyno und der Ostsee.",
        rules: "Hausordnung"
      },
      en: {
        title: "Dom Latarnika - peaceful seaside stay in Grzybowo",
        description: "Dom Latarnika in Grzybowo – seaside holidays on the Polish Baltic coast near Kołobrzeg. Comfortable rooms, studios and an apartment, a shared kitchen, lounge and terrace, a peaceful location near the sea and convenient online booking.",
        skip: "Skip to content",
        a11y_btn_aria: "Accessibility options",
        a11y_panel_aria: "Accessibility tools",
        a11y_close_aria: "Close accessibility panel",
        a11y_title: "Accessibility",
        a11y_text: "Extra settings for a more comfortable browsing experience.",
        a11y_motion: "Less motion",
        a11y_text_size: "Larger text",
        a11y_contrast: "Higher contrast",
        a11y_panel_shown: "Accessibility panel shown.",
        a11y_motion_on: "Reduced motion enabled.",
        a11y_motion_off: "Reduced motion disabled.",
        a11y_text_on: "Larger text enabled.",
        a11y_text_off: "Larger text disabled.",
        a11y_contrast_on: "Higher contrast enabled.",
        a11y_contrast_off: "Higher contrast disabled.",
        nav_offer: "About the property",
        nav_rooms: "Rooms",
        nav_area: "Area",
        nav_reviews: "Reviews",
        nav_contact: "Contact",
        hero_section_aria: "Guesthouse photos",
        brand_home_aria: "Dom Latarnika, go to the top of the page",
        social_facebook: "Facebook",
        social_facebook_aria: "Dom Latarnika Facebook",
        nav_main_aria: "Main navigation",
        lang_switcher_aria: "Language switcher",
        lang_pl_aria: "Polish language",
        lang_de_aria: "German language",
        lang_en_aria: "English language",
        footer_nav_aria: "Footer navigation",
        open_menu_aria: "Open menu",
        close_menu_aria: "Close menu",
        hero_dots_aria: "Slide picker",
        slide_1_aria: "Slide 1",
        slide_2_aria: "Slide 2",
        slide_3_aria: "Slide 3",
        slide_4_aria: "Slide 4",
        gallery_prev_aria: "Previous photos",
        gallery_next_aria: "Next photos",
        gallery_dialog_aria: "Photo preview",
        gallery_close_aria: "Close photo preview",
        gallery_prev_single_aria: "Previous photo",
        gallery_next_single_aria: "Next photo",
        gallery_image_fallback: "Gallery photo",
        gallery_open_hint: "Press Enter to open enlarged photo",
        gallery_modal_help: "Use the arrow keys to change photos and Escape to close the preview.",
        hero_slide_status: "Slide {current} of {total}",
        gallery_modal_status: "Photo {current} of {total}",
        language_changed_status: "English language enabled.",
        new_tab_aria: "Opens in a new tab",
        reviews_google_link_aria: "See Google reviews",
        call: "Call",
        booking: "Booking.com",
        check_availability: "Check availability",
        navigate: "Navigate",
        hero_kicker: "Dom Latarnika Guesthouse · Grzybowo",
        hero_title: "A relaxing holiday by the Baltic Sea",
        hero_text: "A peaceful stay in Grzybowo, close to the sea, with comfortable rooms, studios and an apartment, and convenient online booking.",
        panel_title: "Key information",
        panel_text: "The most important details in one place before planning your stay.",
        panel_location_label: "Location",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Distance to the sea",
        panel_sea_value: "A few minutes' walk to the beach.",
        panel_parking_label: "Parking",
        panel_parking_value: "free, on site",
        panel_booking_label: "Booking",
        panel_booking_value: "online or by phone",
        usp_kicker: "Why choose us",
        usp_title: "Peaceful relaxation close to the sea",
        usp_text: "Comfortable interiors, a calm atmosphere and everything needed for a successful stay.",
        usp1_title: "Family stays",
        usp1_text: "Comfortable rooms and a quiet setting make relaxing with children easy.",
        usp2_title: "For groups",
        usp2_text: "A good option for group stays, team trips and longer visits.",
        usp3_title: "By the sea",
        usp3_text: "The nearby beach and seaside atmosphere create ideal conditions for rest.",
        offer_kicker: "About the property",
        offer_title: "Comfortable, peaceful, close to the sea",
        offer_text1: "A cosy property in a peaceful part of Grzybowo, close to the beach and walking paths yet away from the bustle.",
        offer_text2: "Guests can choose rooms, studios and an apartment with private bathrooms, practical equipment and amenities useful during longer stays.",
        offer_item1: "A few minutes' walk to the beach",
        offer_item2: "Rooms, studios and apartment with bathrooms",
        offer_item3: "Kitchenette, beach gear, bikes and laundry",
        offer_item4: "Gated, monitored parking on site",
        area_kicker: "Surroundings",
        area_title: "Grzybowo and access",
        area_text: "Grzybowo is a peaceful seaside village, ideal for beach time, walks and family cycling trips. Dom Latarnika is close to the beach and the area makes it easy to relax and explore the coast at a calm pace.",
        area_map_alt: "Illustrated map of Grzybowo, Dźwirzyno and Kołobrzeg",
        area_badge_score: "4.6/5",
        area_badge_label: "Peaceful area",
        area_score_button_aria: "Show details about the peaceful area",
        area_item1_title: "Beach and attractions",
        area_item1_text: "Wide beach, walks and seaside attractions nearby.",
        area_item1_button: "See attractions",
        area_item2_title: "Cycling routes",
        area_item2_text: "Family rides and scenic routes towards Kołobrzeg and Dźwirzyno.",
        area_item2_button: "See routes",
        area_item3_title: "Transport & directions",
        area_item3_text: "Check the route to Dom Latarnika and plan your arrival with ease.",
        area_item3_button: "Check directions",
        area_modal_close_aria: "Close surroundings dialog",
        area_score_modal_aria: "Peaceful area",
        area_score_modal_title: "Peaceful area",
        area_score_modal_text: "The location score of 4.6 highlights the peaceful character of Grzybowo and the convenient setting of Dom Latarnika. The property is in a quiet part of the village, close to the beach, walking and cycling routes, while still offering easy access to Kołobrzeg.",
        area_score_point1: "quiet part of Grzybowo,",
        area_score_point2: "close to the beach,",
        area_score_point3: "walking and cycling routes nearby,",
        area_score_point4: "easy access to Kołobrzeg,",
        area_score_point5: "a good location for a family stay.",
        area_beach_modal_aria: "Beach and attractions",
        area_beach_modal_title: "Beach and attractions",
        area_beach_modal_text: "Beach, walks and local attractions — all close to Dom Latarnika.",
        area_beach_modal_button: "Show on map",
        area_beach_card1_title: "Beach in Grzybowo",
        area_beach_card1_subtitle: "around 500 m from the property",
        area_beach_card2_title: "Seaside walks",
        area_beach_card2_subtitle: "peaceful routes by the beach",
        area_beach_card3_title: "Kołobrzeg and nearby area",
        area_beach_card3_subtitle: "attractions just minutes away",
        rooms_kicker: "Rooms",
        rooms_title: "Find your favourite room",
        rooms_text: "We've grouped our rooms into a few categories with character — from a private retreat, through attic rooms, to the connected “Bliźniak” and the apartment. Click a category to see photos and amenities.",
        rooms_note: "Availability and current prices for all rooms are on Booking.com.",
        rooms_note_button: "See availability",
        room_details: "Details",
        room_equipment: "Amenities",
        gallery_section_aria: "Property photo gallery",
        room_modal_aria: "Room details",
        room_modal_close_aria: "Close room dialog",
        room_photos_soon: "Photos coming soon",
        room_names_label: "Rooms in this category",
        room_filters_aria: "Room filters",
        room_filter_all: "All",
        room_filter_two: "2 people",
        room_filter_family: "Family",
        room_filter_attic: "Attic",
        room_filter_balcony: "Balcony",
        room_filter_kitchenette: "Kitchenette",
        room_no_results: "No rooms match this filter.",
        room_meta_capacity: "Capacity",
        room_meta_beds: "Beds",
        room_meta_floor: "Level",
        room_meta_layout: "Balcony / kitchenette",
        room_meta_best_for: "Best for",
        room_capacity_solo: "1 person",
        room_capacity_one_two: "1-2 people",
        room_capacity_two_four: "2-4 people",
        room_capacity_two: "2 people",
        room_capacity_three_five: "3-5 people",
        room_capacity_four_six: "4-6 people",
        room_beds_single: "single bed",
        room_beds_double: "double bed",
        room_beds_flexible: "layout depends on the room",
        room_beds_two_rooms: "two separate rooms",
        room_beds_two_bedrooms: "two bedrooms + living room",
        room_floor_separate: "separate quiet area",
        room_floor_few_steps: "a few steps up",
        room_floor_main: "main part of the house",
        room_floor_attic: "attic",
        room_floor_connected: "connected section",
        room_floor_private: "private entrance",
        room_layout_basic: "no kitchenette or balcony",
        room_layout_balcony: "balcony",
        room_layout_kitchenette: "kitchenette",
        room_layout_full_kitchen: "living room with kitchenette",
        room_best_solo: "solo and quiet stays",
        room_best_couples: "couples and shorter stays",
        room_best_couples_family: "couples and families",
        room_best_attic: "couples or quiet breaks",
        room_best_large_family: "larger families",
        room_best_long_family: "families and longer stays",
        rg_priv_tag: "Private · 1 person",
        rg_priv_title: "Room “0” — a private retreat",
        rg_priv_desc: "A fully private room, separated from the rest of the house, designed for one person. Maximum peace and independence.",
        rg_stairs_tag: "2 rooms · a few steps",
        rg_stairs_title: "Rooms “DO” and “DU”",
        rg_stairs_desc: "These two rooms are reached a few (5) steps up — which gives a pleasant sense of seclusion.",
        rg_std_tag: "6 rooms",
        rg_std_title: "Rooms 1h–6h",
        rg_std_desc: "Comfortable, bright rooms with a private bathroom — great for couples and families. Six numbers to choose from.",
        rg_attic_tag: "2 rooms · attic",
        rg_attic_title: "In the attic — 7h and 8h",
        rg_attic_desc: "Cosy rooms under sloped ceilings, in the attic — with a warm, holiday feel.",
        rg_join_tag: "Connected · Bliźniak",
        rg_join_title: "“R”, “Piętrus” and “Bliźniak”",
        rg_join_desc: "“R” is the owner's favourite room — ask why in person 😉. Together with “Piętrus” they form “Bliźniak”: two separate rooms joined into one, ideal for a larger family.",
        rg_apart_tag: "Apartment",
        rg_apart_title: "Apartment",
        rg_apart_desc: "The most space: separate bedrooms, a living room with a kitchenette and a private entrance.",
        feat_bath: "Private bathroom (shower, WC)",
        feat_tv: "TV",
        feat_fridge: "Refrigerator",
        feat_kettle: "Kettle",
        feat_safe: "Wardrobe with safe",
        feat_wifi: "Free WiFi",
        feat_kitchenette: "Kitchenette",
        feat_balcony: "Balcony",
        feat_premium: "Higher standard",
        feat_two_bedrooms: "Two bedrooms",
        feat_kitchen_full: "Fully equipped kitchenette",
        feat_living: "Separate living room",
        feat_private_entrance: "Private entrance",
        amenities_kicker: "Amenities",
        amenities_title: "Comforts included in your stay",
        amenities_bath: "A private bathroom in every room",
        spaces_kicker: "Shared spaces",
        spaces_title: "Places that bring guests together",
        spaces_text: "Beyond your own room, shared spaces await — for cooking, playing together and relaxing in the fresh air.",
        shared_media_soon: "Photos and videos coming soon",
        shared_kitchen_title: "Shared kitchen",
        shared_kitchen_text: "A fully equipped extra kitchen available to guests — especially handy for longer stays.",
        shared_kitchen_tag: "Available to guests",
        shared_salon_title: "Lounge with games",
        shared_salon_text: "A cosy lounge with an extra TV and a large choice of board games — perfect for evenings with family and friends.",
        shared_salon_tag: "TV and board games",
        shared_terrace_title: "Shared terrace",
        shared_terrace_text: "A quiet terrace by the building — a great spot for morning coffee and evening relaxation after a day at the beach.",
        shared_terrace_tag: "Relaxation area",
        am_wifi: "Free WiFi",
        am_parking: "Gated parking",
        am_monitoring: "24-hour monitoring",
        am_bikes: "Bike rental",
        am_beach_gear: "Beach equipment",
        am_laundry: "Laundry",
        am_grill: "Grill and fire pit",
        am_kitchenette: "Kitchen access",
        am_terrace: "Terrace",
        am_playground: "Green area for children",
        am_linen: "Bed linen and towels",
        am_safe: "In-room safe",
        news_kicker: "News",
        news_title: "What's happening at Dom Latarnika",
        news_text: "We post the latest photos, free dates and special offers on our Facebook. Take a look and stay up to date before the season.",
        news_tag_photo: "Photos",
        news_tag_offer: "Dates",
        news_card1_title: "New photos from the season",
        news_card1_text: "Browse our Facebook gallery — we keep adding photos of the rooms, beach and surroundings.",
        news_card2_title: "Free dates and offers",
        news_card2_text: "We share last-minute availability and special offers on our social media.",
        news_card3_title: "Follow us on Facebook",
        news_card3_text: "Daily updates, photos and quick contact via Messenger.",
        news_card3_button: "Visit profile",
        fb_embed_title: "Facebook feed",
        fb_embed_text: "To show our Facebook feed directly on the page, please accept social media cookies.",
        fb_embed_load: "Show feed",
        fb_embed_open: "Open in a new tab",
        fb_embed_fallback: "Can't see the feed? Open our Facebook profile",
        fb_embed_blocked: "Your browser or an extension blocked the embedded feed. Open our profile directly on Facebook.",
        nav_spaces: "Spaces",
        nav_amenities: "Amenities",
        nav_news: "News",
        hero_rooms_btn: "See rooms",
        hero_scroll_aria: "Scroll down",
        stats_aria: "Dom Latarnika in numbers",
        stats_rooms: "rooms & studios",
        stats_beach_num: "5 min",
        stats_beach: "to the beach",
        privacy: "Privacy policy",
        cookie_text: "We use cookies for traffic analysis and social media content (e.g. the Facebook feed).",
        cookie_decline: "Decline",
        cookie_accept: "Accept",
        reviews_kicker: "Reviews",
        reviews_title: "Reviews that build confidence",
        reviews_text: "High Booking.com scores and positive Google reviews confirm the peaceful character of the stay and the quality of the service.",
        reviews_booking_label: "Exceptional",
        reviews_booking_count: "39 reviews",
        reviews_booking_desc: "Guests especially appreciate the location, peaceful atmosphere and comfort of the stay.",
        reviews_booking_meta1: "Location 9.9",
        reviews_google_title: "Google",
        reviews_google_scoreline: "4.5 / 5",
        reviews_google_desc: "Guests gladly return for the intimate atmosphere, comfort and close distance to the sea.",
        reviews_google_count: "177 reviews",
        reviews_open_button: "Read reviews",
        reviews_summary_title: "Most often praised",
        reviews_summary_text: "Location, cleanliness, peaceful surroundings and a friendly atmosphere.",
        contact_kicker: "Contact and booking",
        contact_title: "Plan your stay",
        contact_text: "Contact us by phone, check availability online or see the most important information about the stay.",
        contact_booking_title: "Contact and booking",
        contact_booking_text: "Call us or check availability online. We are happy to answer your questions about the stay and booking.",
        contact_booking_button: "Book your stay",
        booking_modal_aria: "Contact and booking",
        booking_modal_close_aria: "Close booking dialog",
        book_online: "Book online",
        contact_payment_title: "Stay and payment",
        contact_payment_text: "Check-in hours, deposit details and the information needed for direct booking.",
        contact_address_title: "Address and directions",
        contact_address_text: "See the location of the property and start navigation to Dom Latarnika.",
        details_show: "Details",
        details_hide: "Details",
        payment_open_button: "Bank transfer details",
        payment_modal_title: "Bank transfer details",
        payment_modal_aria: "Bank transfer details",
        payment_modal_close_aria: "Close bank transfer details dialog",
        payment_line1: "Check-in hours are from 15:00 to 10:00.",
        payment_line2: "For direct bookings, a deposit of 30% of the stay value is required.",
        payment_line3: "The local tourist tax is not included in the stay price.",
        payment_bank_title: "Bank transfer details",
        payment_recipient_label: "Recipient:",
        payment_recipient_value: "Dom Latarnika",
        payment_account_label: "Account number:",
        payment_transfer_label: "Transfer title:",
        payment_transfer_value: "Deposit — first and last name, stay dates",
        payment_example_label: "Example:",
        payment_example_value: "Deposit — Anna Kowalska, 12–18.07.2026",
        footer_title: "Dom Latarnika",
        footer_text: "Grzybowo · ul. Nadmorska 65A",
        footer_seo: "Seaside holidays in Grzybowo – accommodation on the Polish Baltic coast near Kołobrzeg, Dźwirzyno and the Baltic Sea.",
        rules: "Rules"
      }
    };

    const attractionCards = [
      {
        key: "grzybowo-beach",
        titleKey: "area_beach_card1_title",
        subtitleKey: "area_beach_card1_subtitle",
        images: [
          "img/beach/beach-07.webp",
          "img/beach/beach-06.webp",
          "img/beach/beach-05.webp",
          "img/beach/beach-01.webp"
        ]
      },
      {
        key: "seaside-walks",
        titleKey: "area_beach_card2_title",
        subtitleKey: "area_beach_card2_subtitle",
        images: [
          "img/beach/beach-02.webp",
          "img/beach/beach-04.webp",
          "img/beach/beach-08.webp"
        ]
      },
      {
        key: "kolobrzeg-area",
        titleKey: "area_beach_card3_title",
        subtitleKey: "area_beach_card3_subtitle",
        images: [
          "img/beach/beach-03.webp",
          "img/beach/beach-08.webp",
          "img/beach/beach-04.webp"
        ]
      }
    ];

    // Kolekcje pokoi — pogrupowane, aby nie zasypywać gościa listą kilkunastu pokoi.
    // Każda grupa: nazwy pokoi (names), zdjęcia, metadane decyzyjne i wyposażenie.
    // Aby dodać zdjęcia: wrzuć pliki do img/rooms/ i wpisz ich ścieżki w "images".
    const roomGroups = [
      {
        id: "prywatny",
        images: ["img/rooms/room-geometric.webp"],
        names: ["0"],
        tagKey: "rg_priv_tag",
        titleKey: "rg_priv_title",
        descKey: "rg_priv_desc",
        capacityKey: "room_capacity_solo",
        bedsKey: "room_beds_single",
        floorKey: "room_floor_separate",
        layoutKey: "room_layout_basic",
        bestForKey: "room_best_solo",
        filterTags: ["solo"],
        featureKeys: ["feat_bath", "feat_tv", "feat_fridge", "feat_wifi"]
      },
      {
        id: "schodki",
        images: ["img/rooms/double-striped.webp", "img/rooms/marine.webp"],
        names: ["DO", "DU"],
        tagKey: "rg_stairs_tag",
        titleKey: "rg_stairs_title",
        descKey: "rg_stairs_desc",
        capacityKey: "room_capacity_one_two",
        bedsKey: "room_beds_double",
        floorKey: "room_floor_few_steps",
        layoutKey: "room_layout_basic",
        bestForKey: "room_best_couples",
        filterTags: ["two"],
        featureKeys: ["feat_bath", "feat_tv", "feat_fridge", "feat_kettle", "feat_wifi"]
      },
      {
        id: "standard",
        images: ["img/rooms/room-3h-01.webp", "img/rooms/room-3h-02.webp", "img/rooms/room-3h-03.webp", "img/rooms/room-3h-04.webp", "img/rooms/room-palm-01.webp", "img/rooms/room-palm-02.webp", "img/rooms/room-palm-03.webp", "img/rooms/room-palm-04.webp", "img/rooms/room-blue-attic.webp"],
        names: ["1h", "2h", "3h", "4h", "5h", "6h"],
        tagKey: "rg_std_tag",
        titleKey: "rg_std_title",
        descKey: "rg_std_desc",
        capacityKey: "room_capacity_two_four",
        bedsKey: "room_beds_flexible",
        floorKey: "room_floor_main",
        layoutKey: "room_layout_basic",
        bestForKey: "room_best_couples_family",
        filterTags: ["two", "family"],
        featureKeys: ["feat_bath", "feat_tv", "feat_fridge", "feat_kettle", "feat_safe", "feat_wifi"]
      },
      {
        id: "poddasze",
        images: ["img/rooms/attic-skylight.webp", "img/rooms/attic-studio-dining.webp", "img/rooms/attic-studio.webp"],
        names: ["7h", "8h"],
        tagKey: "rg_attic_tag",
        titleKey: "rg_attic_title",
        descKey: "rg_attic_desc",
        capacityKey: "room_capacity_two",
        bedsKey: "room_beds_double",
        floorKey: "room_floor_attic",
        layoutKey: "room_layout_basic",
        bestForKey: "room_best_attic",
        filterTags: ["two", "attic"],
        featureKeys: ["feat_bath", "feat_tv", "feat_fridge", "feat_kettle", "feat_wifi"]
      },
      {
        id: "laczone",
        images: ["img/rooms/blizniak-01.webp", "img/rooms/blizniak-02.webp", "img/rooms/blizniak-03.webp", "img/rooms/studio-balcony-01.webp", "img/rooms/studio-balcony-02.webp"],
        names: ["R", "Piętrus", "Bliźniak"],
        tagKey: "rg_join_tag",
        titleKey: "rg_join_title",
        descKey: "rg_join_desc",
        capacityKey: "room_capacity_three_five",
        bedsKey: "room_beds_two_rooms",
        floorKey: "room_floor_connected",
        layoutKey: "room_layout_balcony",
        bestForKey: "room_best_large_family",
        filterTags: ["family", "balcony"],
        featureKeys: ["feat_bath", "feat_tv", "feat_fridge", "feat_kettle", "feat_balcony", "feat_wifi"]
      },
      {
        id: "apartament",
        images: ["img/rooms/apartment-living-01.webp", "img/rooms/apartment-living-02.webp"],
        names: ["Apartament"],
        tagKey: "rg_apart_tag",
        titleKey: "rg_apart_title",
        descKey: "rg_apart_desc",
        capacityKey: "room_capacity_four_six",
        bedsKey: "room_beds_two_bedrooms",
        floorKey: "room_floor_private",
        layoutKey: "room_layout_full_kitchen",
        bestForKey: "room_best_long_family",
        filterTags: ["family", "kitchenette"],
        featureKeys: ["feat_two_bedrooms", "feat_kitchen_full", "feat_living", "feat_private_entrance", "feat_bath", "feat_wifi"]
      }
    ];

    const roomTypes = roomGroups.map((group, index) => ({
      ...group,
      index,
      cover: group.images[0] || ""
    }));

    // Wspólne przestrzenie. Zdjęcia dodasz w img/shared/ (pole image), nagrania w polu video
    // (np. wideo o nazwie kuchnia.mp4 w katalogu img/shared). Pusta wartość = placeholder „Zdjęcia i nagrania wkrótce".
    const sharedSpaces = [
      { id: "kitchen", icon: "kitchen",  image: "img/shared/kuchnia-01.webp", video: "",                     titleKey: "shared_kitchen_title", textKey: "shared_kitchen_text", tagKey: "shared_kitchen_tag" },
      { id: "salon",   icon: "games",    image: "img/shared/salon-01.webp",   video: "img/shared/salon.mp4", titleKey: "shared_salon_title",   textKey: "shared_salon_text",   tagKey: "shared_salon_tag" },
      { id: "terrace", icon: "terrace",  image: "img/shared/taras.webp",      video: "",                     titleKey: "shared_terrace_title", textKey: "shared_terrace_text", tagKey: "shared_terrace_tag" }
    ];

    const amenityItems = [
      { icon: "wifi", labelKey: "am_wifi" },
      { icon: "parking", labelKey: "am_parking" },
      { icon: "shield", labelKey: "am_monitoring" },
      { icon: "bike", labelKey: "am_bikes" },
      { icon: "beach", labelKey: "am_beach_gear" },
      { icon: "wash", labelKey: "am_laundry" },
      { icon: "grill", labelKey: "am_grill" },
      { icon: "kitchen", labelKey: "am_kitchenette" },
      { icon: "terrace", labelKey: "am_terrace" },
      { icon: "play", labelKey: "am_playground" },
      { icon: "bed", labelKey: "am_linen" },
      { icon: "safe", labelKey: "am_safe" }
    ];

    const amenityIcons = {
      wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1.2" fill="currentColor" stroke="none"/><path d="M2 9a15 15 0 0 1 20 0"/>',
      parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 16V8h3.5a2.5 2.5 0 0 1 0 5H9"/>',
      shield: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
      bike: '<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17l4-7h4l3 7M10 10h5M13.5 7h3"/>',
      beach: '<path d="M12 21V9"/><path d="M4 21h16"/><path d="M12 9a7 7 0 0 1 8 4H12z"/><path d="M12 9a7 7 0 0 0-8 4"/>',
      wash: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6h.01M11 6h.01"/>',
      grill: '<circle cx="12" cy="10" r="6"/><path d="M9 16l-1.5 4M15 16l1.5 4M8 10h8"/>',
      kitchen: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M8 5v1M8 13v4"/>',
      terrace: '<path d="M3 20h18"/><path d="M5 20v-7h14v7"/><path d="M5 13l7-6 7 6"/>',
      play: '<circle cx="12" cy="5" r="2"/><path d="M12 7v6M8 21l4-8 4 8M6 12h12"/>',
      bed: '<path d="M3 18v-6h18v6M3 18v2M21 18v2"/><path d="M3 12V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M7 12v-2h4v2"/>',
      safe: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3.2"/><path d="M12 4v16"/>',
      games: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
      tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'
    };

    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");
    const heroStatus = document.getElementById("hero-slider-status");
    const pageStatus = document.getElementById("page-status");
    const a11yPanel = document.getElementById("a11y-panel");
    const a11yTrigger = document.getElementById("a11y-trigger");
    const a11yClose = a11yPanel.querySelector(".a11y-panel-close");
    const a11yButtons = Array.from(a11yPanel.querySelectorAll("[data-a11y-toggle]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const A11Y_STORAGE_KEY = "dom_latarnika_a11y";
    let hasInitializedLanguage = false;
    let heroAutoInterval = null;
    let a11yPanelDismissed = false;
    let a11yPrefs = { motion: false, text: false, contrast: false };

    function loadA11yPrefs() {
      try {
        const stored = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || "{}");
        a11yPrefs = {
          motion: Boolean(stored.motion),
          text: Boolean(stored.text),
          contrast: Boolean(stored.contrast)
        };
      } catch {
        a11yPrefs = { motion: false, text: false, contrast: false };
      }
    }

    function saveA11yPrefs() {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(a11yPrefs));
    }

    function isMotionReduced() {
      return prefersReducedMotion.matches || a11yPrefs.motion;
    }

    function showA11yPanel({ announce = false, focusFirst = false } = {}) {
      if (a11yPanelDismissed) return;
      if (!a11yPanel.hidden) return;
      a11yPanel.hidden = false;
      a11yTrigger.setAttribute("aria-expanded", "true");
      if (focusFirst && a11yButtons.length > 0) {
        setTimeout(() => a11yButtons[0].focus(), 0);
      }
      if (announce) {
        const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
        pageStatus.textContent = dict.a11y_panel_shown;
      }
    }

    function hideA11yPanel({ dismiss = true } = {}) {
      a11yPanel.hidden = true;
      a11yTrigger.setAttribute("aria-expanded", "false");
      if (dismiss) a11yPanelDismissed = true;
    }

    function toggleA11yPanel() {
      if (a11yPanel.hidden) {
        a11yPanelDismissed = false;
        a11yPanel.hidden = false;
        a11yTrigger.setAttribute("aria-expanded", "true");
        setTimeout(() => a11yButtons[0]?.focus(), 0);
        const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
        pageStatus.textContent = dict.a11y_panel_shown;
      } else {
        hideA11yPanel({ dismiss: false });
      }
    }

    function applyA11yPrefs({ announceKey = "" } = {}) {
      document.body.classList.toggle("a11y-reduce-motion", a11yPrefs.motion);
      document.body.classList.toggle("a11y-large-text", a11yPrefs.text);
      document.body.classList.toggle("a11y-high-contrast", a11yPrefs.contrast);
      document.documentElement.style.scrollBehavior = a11yPrefs.motion ? "auto" : "";
      a11yButtons.forEach((button) => {
        const key = button.dataset.a11yToggle;
        button.setAttribute("aria-pressed", String(Boolean(a11yPrefs[key])));
      });
      startHeroAutoplay();
      document.querySelectorAll(".gallery-clean").forEach((gallery) => {
        if (typeof gallery._restartAutoMotion === "function") gallery._restartAutoMotion();
      });
      if (announceKey) {
        const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
        pageStatus.textContent = dict[announceKey] || "";
      }
      saveA11yPrefs();
    }

    function isMobileNavLayout() {
      return window.innerWidth <= 1080;
    }

    function syncMenuState() {
      const isMobile = isMobileNavLayout();
      const isOpen = mainNav.classList.contains("is-open");
      if (!isMobile) {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
      mainNav.setAttribute("aria-hidden", String(isMobile && !isOpen));
      if (!isMobile) {
        mainNav.setAttribute("aria-hidden", "false");
      }
      updateMenuToggleLabel(document.documentElement.lang || "pl");
    }

    function updateMenuToggleLabel(lang) {
      const dict = translations[lang] || translations.pl;
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-label", isOpen ? dict.close_menu_aria : dict.open_menu_aria);
    }

    function stopHeroAutoplay() {
      window.clearInterval(heroAutoInterval);
      heroAutoInterval = null;
    }

    function startHeroAutoplay() {
      stopHeroAutoplay();
      if (isMotionReduced()) return;
      heroAutoInterval = window.setInterval(() => {
        showSlide(slideIndex + 1);
      }, 5200);
    }

    function updateExternalLinkLabels(dict) {
      document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const baseLabel = link.hasAttribute("data-i18n-aria-label")
          ? (link.getAttribute("aria-label") || "")
          : link.textContent.trim().replace(/\s+/g, " ");
        link.setAttribute("aria-label", `${baseLabel}. ${dict.new_tab_aria}`);
      });
    }

    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      mainNav.setAttribute("aria-hidden", String(!isOpen));
      if (isOpen) {
        const firstLink = getFocusableElements(mainNav)[0];
        if (firstLink) firstLink.focus();
      }
      updateMenuToggleLabel(document.documentElement.lang || "pl");
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1080) {
          mainNav.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
          mainNav.setAttribute("aria-hidden", "true");
          updateMenuToggleLabel(document.documentElement.lang || "pl");
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Tab") document.body.classList.add("keyboard-nav");
      if (!isMobileNavLayout() || !mainNav.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        mainNav.setAttribute("aria-hidden", "true");
        updateMenuToggleLabel(document.documentElement.lang || "pl");
        menuToggle.focus();
      }
      if (event.key === "Tab") trapFocusIn(mainNav, event);
    });

    window.addEventListener("resize", syncMenuState);

    a11yButtons.forEach((button) => {
      const toggleA11yFeature = () => {
        const key = button.dataset.a11yToggle;
        a11yPrefs[key] = !a11yPrefs[key];
        const announceMap = {
          motion: a11yPrefs[key] ? "a11y_motion_on" : "a11y_motion_off",
          text: a11yPrefs[key] ? "a11y_text_on" : "a11y_text_off",
          contrast: a11yPrefs[key] ? "a11y_contrast_on" : "a11y_contrast_off"
        };
        applyA11yPrefs({ announceKey: announceMap[key] });
      };

      button.addEventListener("click", toggleA11yFeature);

      button.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          toggleA11yFeature();
        }
      });
    });

    a11yClose.addEventListener("click", () => hideA11yPanel({ dismiss: true }));
    a11yTrigger.addEventListener("click", toggleA11yPanel);

    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const dots = Array.from(document.querySelectorAll(".hero-dots button"));
    const heroSlider = document.getElementById("hero-slider");
    let slideIndex = 0;

    function showSlide(index) {
      slideIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === slideIndex);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === slideIndex);
        dot.setAttribute("aria-pressed", String(i === slideIndex));
      });
      heroStatus.textContent = formatMessage((translations[document.documentElement.lang || "pl"] || translations.pl).hero_slide_status, {
        current: slideIndex + 1,
        total: slides.length
      });
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        startHeroAutoplay();
      });
      dot.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          dots[(index + 1) % dots.length].focus();
          showSlide(index + 1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          dots[(index - 1 + dots.length) % dots.length].focus();
          showSlide(index - 1);
        }
        if (event.key === "Home") {
          event.preventDefault();
          dots[0].focus();
          showSlide(0);
        }
        if (event.key === "End") {
          event.preventDefault();
          dots[dots.length - 1].focus();
          showSlide(dots.length - 1);
        }
      });
    });

    heroSlider.addEventListener("mouseenter", stopHeroAutoplay);
    heroSlider.addEventListener("mouseleave", startHeroAutoplay);
    heroSlider.addEventListener("focusin", stopHeroAutoplay);
    heroSlider.addEventListener("focusout", startHeroAutoplay);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopHeroAutoplay();
      } else {
        startHeroAutoplay();
      }
    });

    prefersReducedMotion.addEventListener("change", (event) => {
      startHeroAutoplay();
      document.querySelectorAll(".gallery-clean").forEach((gallery) => {
        if (typeof gallery._restartAutoMotion === "function") gallery._restartAutoMotion();
      });
    });

    const BEACH_ROTATION_DELAY = 3500;

    function renderAreaAttractions(dict) {
      return attractionCards.map((card) => {
        const title = dict[card.titleKey] || "";
        const subtitle = dict[card.subtitleKey] || "";
        const alt = subtitle ? `${title} — ${subtitle}` : title;
        const encodedImages = JSON.stringify(card.images).replace(/"/g, "&quot;");
        return `
          <article class="area-attraction-card" data-attraction-card data-images="${encodedImages}" data-alt="${alt}">
            <div class="area-attraction-media">
              <img src="${card.images[0]}" alt="${alt}">
              <div class="area-attraction-overlay">
                <strong>${title}</strong>
                <span>${subtitle}</span>
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    function stopAttractionRotators() {
      document.querySelectorAll("[data-attraction-card]").forEach((card) => {
        if (card._rotationTimer) {
          window.clearInterval(card._rotationTimer);
          card._rotationTimer = null;
        }
      });
    }

    function startAttractionRotators() {
      stopAttractionRotators();
      document.querySelectorAll("[data-attraction-card]").forEach((card) => {
        const imageNode = card.querySelector("img");
        const images = JSON.parse(card.dataset.images || "[]");
        if (!imageNode || images.length < 2) return;
        card._rotationIndex = Number(card._rotationIndex || 0);

        const rotateImage = () => {
          const nextIndex = (Number(card._rotationIndex || 0) + 1) % images.length;
          imageNode.classList.add("is-fading");
          window.setTimeout(() => {
            card._rotationIndex = nextIndex;
            imageNode.src = images[nextIndex];
            imageNode.alt = card.dataset.alt || imageNode.alt;
            window.requestAnimationFrame(() => imageNode.classList.remove("is-fading"));
          }, 170);
        };

        const resumeRotation = () => {
          if (card._rotationTimer) return;
          card._rotationTimer = window.setInterval(rotateImage, BEACH_ROTATION_DELAY);
        };

        const pauseRotation = () => {
          if (!card._rotationTimer) return;
          window.clearInterval(card._rotationTimer);
          card._rotationTimer = null;
        };

        if (card.dataset.rotationBound !== "true") {
          card.addEventListener("mouseenter", pauseRotation);
          card.addEventListener("mouseleave", resumeRotation);
          card.addEventListener("focusin", pauseRotation);
          card.addEventListener("focusout", resumeRotation);
          card.dataset.rotationBound = "true";
        }

        resumeRotation();
      });
    }

    function renderAreaGalleries(lang) {
      const dict = translations[lang] || translations.pl;
      const beachGrid = document.querySelector('[data-area-grid="beach"]');
      if (beachGrid) beachGrid.innerHTML = renderAreaAttractions(dict);
      if (activeAreaModal === areaModalMap.beach) {
        startAttractionRotators();
      } else {
        stopAttractionRotators();
      }
    }

    const BOOKING_URL = "https://www.booking.com/hotel/pl/pensjonat-dom-latarnika.pl.html";

    const revealItems = document.querySelectorAll("[data-reveal]");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    function roomNamesChips(group) {
      return group.names.map((n) => `<span class="room-name-chip">${n}</span>`).join("");
    }

    let activeRoomFilter = "all";

    function roomMetaItems(group, dict) {
      return [
        { label: dict.room_meta_capacity, value: dict[group.capacityKey] },
        { label: dict.room_meta_beds, value: dict[group.bedsKey] },
        { label: dict.room_meta_floor, value: dict[group.floorKey] },
        { label: dict.room_meta_layout, value: dict[group.layoutKey] },
        { label: dict.room_meta_best_for, value: dict[group.bestForKey] }
      ].filter((item) => item.label && item.value);
    }

    function roomMetaMarkup(group, dict, className) {
      return `
        <dl class="room-meta ${className || ""}">
          ${roomMetaItems(group, dict).map((item) => `
            <div class="room-meta-item">
              <dt>${item.label}</dt>
              <dd>${item.value}</dd>
            </div>
          `).join("")}
        </dl>
      `;
    }

    function roomMatchesFilter(group) {
      return activeRoomFilter === "all" || (group.filterTags || []).includes(activeRoomFilter);
    }

    function updateRoomFilterButtons() {
      document.querySelectorAll("[data-room-filter]").forEach((button) => {
        const isActive = button.dataset.roomFilter === activeRoomFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }

    function renderRooms(lang) {
      const grid = document.getElementById("rooms-grid");
      if (!grid) return;
      const dict = translations[lang] || translations.pl;
      const visibleRooms = roomTypes.filter(roomMatchesFilter);
      updateRoomFilterButtons();
      if (!visibleRooms.length) {
        grid.innerHTML = `<p class="room-empty">${dict.room_no_results || "Brak pokoi dla wybranego filtra."}</p>`;
        return;
      }
      grid.innerHTML = visibleRooms.map((group) => {
        const title = dict[group.titleKey] || "";
        const desc = dict[group.descKey] || "";
        const tag = dict[group.tagKey] || "";
        const capacity = dict[group.capacityKey] || "";
        const media = group.cover
          ? `<img src="${group.cover}" alt="${title}" loading="lazy">`
          : `<div class="room-card-placeholder"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 44V20l4-6 4 6v24"/><path d="M20 26h8M20 32h8M20 38h8"/><path d="M14 22l-4 3M34 22l4 3M16 44H8M40 44h-8"/></svg><span>${dict.room_photos_soon || "Zdjęcia wkrótce"}</span></div>`;
        return `
          <article class="card room-card${group.cover ? "" : " room-card--placeholder"}" data-room-index="${group.index}" data-reveal>
            <div class="room-card-media">
              ${media}
              <span class="room-card-badge">${tag}</span>
              <span class="room-card-capacity" aria-label="${dict.room_meta_capacity || "Liczba osób"}: ${capacity}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${capacity}
              </span>
            </div>
            <div class="room-body">
              <h3>${title}</h3>
              <p>${desc}</p>
              ${roomMetaMarkup(group, dict, "room-card-meta")}
              <div class="room-names" aria-label="${dict.room_names_label || "Pokoje w tej kategorii"}">${roomNamesChips(group)}</div>
              <div class="room-card-actions">
                <button class="button button-secondary" type="button" data-room-open="${group.index}">${dict.room_details || "Szczegóły"}</button>
                <a class="button button-primary" href="${BOOKING_URL}" target="_blank" rel="noopener">${dict.book_online || "Rezerwuj"}</a>
              </div>
            </div>
          </article>
        `;
      }).join("");
      grid.querySelectorAll("[data-reveal]").forEach((item) => revealObserver.observe(item));
    }

    const roomFilters = document.getElementById("room-filters");
    if (roomFilters) {
      roomFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-room-filter]");
        if (!button || !roomFilters.contains(button)) return;
        activeRoomFilter = button.dataset.roomFilter || "all";
        renderRooms(document.documentElement.lang || "pl");
      });
    }

    function renderAmenities(lang) {
      const grid = document.getElementById("amenities-grid");
      if (!grid) return;
      const dict = translations[lang] || translations.pl;
      grid.innerHTML = amenityItems.map((item) => `
        <span class="amenity-chip">
          <span class="amenity-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${amenityIcons[item.icon] || ""}</svg>
          </span>
          ${dict[item.labelKey] || ""}
        </span>
      `).join("");
    }

    function renderSharedSpaces(lang) {
      const grid = document.getElementById("shared-grid");
      if (!grid) return;
      const dict = translations[lang] || translations.pl;
      grid.innerHTML = sharedSpaces.map((space) => {
        const title = dict[space.titleKey] || "";
        const text = dict[space.textKey] || "";
        const tag = dict[space.tagKey] || "";
        let media;
        if (space.video) {
          media = `<video class="shared-media-el" controls preload="metadata"${space.image ? ` poster="${space.image}"` : ""}>
              <source src="${space.video}" type="video/mp4">
            </video>`;
        } else if (space.image) {
          media = `<img class="shared-media-el" src="${space.image}" alt="${title}" loading="lazy">`;
        } else {
          media = `<div class="shared-media-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${amenityIcons[space.icon] || ""}</svg>
              <span>${dict.shared_media_soon || "Zdjęcia i nagrania wkrótce"}</span>
            </div>`;
        }
        return `
          <article class="shared-card">
            <div class="shared-media${space.video ? " has-video" : ""}${space.image || space.video ? "" : " is-empty"}">
              ${media}
              <span class="shared-tag">${tag}</span>
            </div>
            <div class="shared-body">
              <span class="shared-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${amenityIcons[space.icon] || ""}</svg>
              </span>
              <div>
                <h3>${title}</h3>
                <p>${text}</p>
              </div>
            </div>
          </article>
        `;
      }).join("");
    }

    // ---- Modal pojedynczego pokoju ----
    const roomModal = document.getElementById("room-modal");
    const roomModalBody = document.getElementById("room-modal-body");
    let lastRoomTrigger = null;
    let roomModalIndex = 0;

    function buildRoomModalContent(group, lang) {
      const dict = translations[lang] || translations.pl;
      const title = dict[group.titleKey] || "";
      const desc = dict[group.descKey] || "";
      const tag = dict[group.tagKey] || "";
      const hasImages = group.images.length > 0;
      const thumbs = group.images.map((src, i) => `
        <button type="button" class="room-modal-thumb${i === 0 ? " is-active" : ""}" data-room-thumb="${i}" aria-label="${dict.gallery_image_fallback || "Zdjęcie"} ${i + 1}">
          <img src="${src}" alt="" loading="lazy">
        </button>
      `).join("");
      const features = group.featureKeys.map((key) => `
        <li><span class="room-modal-check" aria-hidden="true">✓</span>${dict[key] || ""}</li>
      `).join("");
      const nameChips = group.names.map((n) => `<span class="room-name-chip">${n}</span>`).join("");
      const stage = hasImages
        ? `<img id="room-modal-stage-img" src="${group.images[0]}" alt="${title}">`
        : `<div class="room-modal-placeholder">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 44V20l4-6 4 6v24"/><path d="M20 26h8M20 32h8M20 38h8"/><path d="M14 22l-4 3M34 22l4 3M16 44H8M40 44h-8"/></svg>
            <span>${dict.room_photos_soon || "Zdjęcia wkrótce"}</span>
          </div>`;
      return `
        <div class="room-modal-gallery">
          <div class="room-modal-stage${hasImages ? "" : " is-empty"}">
            ${stage}
            <span class="room-modal-badge">${tag}</span>
          </div>
          <div class="room-modal-thumbs">${thumbs}</div>
        </div>
        <div class="room-modal-info">
          <span class="section-kicker">${dict.rooms_kicker || ""}</span>
          <h3 id="room-modal-title">${title}</h3>
          <p class="room-modal-desc">${desc}</p>
          ${roomMetaMarkup(group, dict, "room-modal-meta")}
          <strong class="room-modal-subtitle">${dict.room_names_label || "Pokoje w tej kategorii"}</strong>
          <div class="room-modal-names">${nameChips}</div>
          <strong class="room-modal-subtitle">${dict.room_equipment || "Wyposażenie"}</strong>
          <ul class="room-modal-features">${features}</ul>
          <div class="room-modal-actions">
            <a class="button button-primary" href="${BOOKING_URL}" target="_blank" rel="noopener">${dict.check_availability || "Sprawdź dostępność"}</a>
            <a class="button button-secondary phone-label" href="${phoneByLang[lang] || phoneByLang.pl}">${dict.call || "Zadzwoń"}</a>
          </div>
        </div>
      `;
    }

    function bindRoomModalThumbs(room) {
      const stageImg = document.getElementById("room-modal-stage-img");
      roomModalBody.querySelectorAll("[data-room-thumb]").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const idx = Number(thumb.dataset.roomThumb);
          if (stageImg) stageImg.src = room.images[idx];
          roomModalBody.querySelectorAll("[data-room-thumb]").forEach((t) => t.classList.remove("is-active"));
          thumb.classList.add("is-active");
        });
      });
    }

    function openRoomModal(index, trigger) {
      const room = roomTypes[index];
      if (!room || !roomModal) return;
      roomModalIndex = index;
      lastRoomTrigger = trigger || document.activeElement;
      roomModalBody.innerHTML = buildRoomModalContent(room, document.documentElement.lang || "pl");
      bindRoomModalThumbs(room);
      roomModal.hidden = false;
      document.body.style.overflow = "hidden";
      roomModal.querySelector("[data-room-modal-close]")?.focus();
    }

    function closeRoomModal() {
      if (!roomModal || roomModal.hidden) return;
      roomModal.hidden = true;
      document.body.style.overflow = "";
      if (lastRoomTrigger instanceof HTMLElement) lastRoomTrigger.focus();
    }

    if (roomModal) {
      document.addEventListener("click", (event) => {
        const opener = event.target.closest("[data-room-open]");
        if (opener) {
          openRoomModal(Number(opener.dataset.roomOpen), opener);
        }
      });
      roomModal.querySelector("[data-room-modal-close]")?.addEventListener("click", closeRoomModal);
      roomModal.addEventListener("click", (event) => {
        if (event.target === roomModal) closeRoomModal();
      });
      document.addEventListener("keydown", (event) => {
        if (roomModal.hidden) return;
        if (event.key === "Escape") {
          closeRoomModal();
          return;
        }
        const dialog = roomModal.querySelector(".room-modal-dialog");
        if (event.key === "Tab" && dialog) trapFocusIn(dialog, event);
      });
    }

    const areaModalMap = {
      beach: document.getElementById("area-beach-modal"),
      score: document.getElementById("area-score-modal")
    };
    const areaModalOpeners = Array.from(document.querySelectorAll("[data-area-modal-open]"));
    const areaModalClosers = Array.from(document.querySelectorAll("[data-area-modal-close]"));
    let activeAreaModal = null;
    let lastAreaModalTrigger = null;

    function openAreaModal(type, trigger) {
      const modal = areaModalMap[type];
      if (!modal) return;
      if (activeAreaModal && activeAreaModal !== modal) {
        activeAreaModal.hidden = true;
      }
      activeAreaModal = modal;
      lastAreaModalTrigger = trigger || document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      if (type === "beach") {
        startAttractionRotators();
      } else {
        stopAttractionRotators();
      }
      modal.querySelector("[data-area-modal-close]")?.focus();
    }

    function closeAreaModal() {
      if (!activeAreaModal) return;
      activeAreaModal.hidden = true;
      stopAttractionRotators();
      document.body.style.overflow = "";
      if (lastAreaModalTrigger instanceof HTMLElement) {
        lastAreaModalTrigger.focus();
      }
      activeAreaModal = null;
    }

    areaModalOpeners.forEach((button) => {
      button.addEventListener("click", () => openAreaModal(button.dataset.areaModalOpen, button));
    });

    areaModalClosers.forEach((button) => {
      button.addEventListener("click", closeAreaModal);
    });

    Object.values(areaModalMap).forEach((modal) => {
      if (!modal) return;
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeAreaModal();
      });
    });

    const bookingModal = document.getElementById("booking-modal");
    const bookingModalDialog = bookingModal?.querySelector(".booking-modal-dialog");
    const bookingModalOpeners = Array.from(document.querySelectorAll("[data-booking-modal-open]"));
    const bookingModalClosers = Array.from(document.querySelectorAll("[data-booking-modal-close]"));
    let lastBookingModalTrigger = null;

    function openBookingModal(trigger) {
      if (!bookingModal) return;
      lastBookingModalTrigger = trigger || document.activeElement;
      bookingModal.hidden = false;
      document.body.style.overflow = "hidden";
      bookingModalClosers[0]?.focus();
    }

    function closeBookingModal() {
      if (!bookingModal) return;
      bookingModal.hidden = true;
      document.body.style.overflow = "";
      if (lastBookingModalTrigger instanceof HTMLElement) {
        lastBookingModalTrigger.focus();
      }
    }

    bookingModalOpeners.forEach((button) => {
      button.addEventListener("click", () => openBookingModal(button));
    });

    bookingModalClosers.forEach((button) => {
      button.addEventListener("click", closeBookingModal);
    });

    if (bookingModal) {
      bookingModal.addEventListener("click", (event) => {
        if (event.target === bookingModal) {
          closeBookingModal();
        }
      });
    }

    const paymentModal = document.getElementById("payment-modal");
    const paymentModalDialog = paymentModal?.querySelector(".payment-modal-dialog");
    const paymentModalOpeners = Array.from(document.querySelectorAll("[data-payment-modal-open]"));
    const paymentModalClosers = Array.from(document.querySelectorAll("[data-payment-modal-close]"));
    let lastPaymentModalTrigger = null;

    function openPaymentModal(trigger) {
      if (!paymentModal) return;
      lastPaymentModalTrigger = trigger || document.activeElement;
      paymentModal.hidden = false;
      document.body.style.overflow = "hidden";
      paymentModalClosers[0]?.focus();
    }

    function closePaymentModal() {
      if (!paymentModal) return;
      paymentModal.hidden = true;
      document.body.style.overflow = "";
      if (lastPaymentModalTrigger instanceof HTMLElement) {
        lastPaymentModalTrigger.focus();
      }
    }

    paymentModalOpeners.forEach((button) => {
      button.addEventListener("click", () => openPaymentModal(button));
    });

    paymentModalClosers.forEach((button) => {
      button.addEventListener("click", closePaymentModal);
    });

    if (paymentModal) {
      paymentModal.addEventListener("click", (event) => {
        if (event.target === paymentModal) {
          closePaymentModal();
        }
      });

      document.addEventListener("keydown", (event) => {
        if (activeAreaModal) {
          const dialog = activeAreaModal.querySelector(".area-modal-dialog");
          if (event.key === "Escape") {
            closeAreaModal();
            return;
          }
          if (event.key === "Tab" && dialog) {
            trapFocusIn(dialog, event);
            return;
          }
        }
        if (bookingModal && !bookingModal.hidden && bookingModalDialog) {
          if (event.key === "Escape") {
            closeBookingModal();
            return;
          }
          if (event.key === "Tab") {
            trapFocusIn(bookingModalDialog, event);
            return;
          }
        }
        if (paymentModal.hidden) return;
        if (event.key === "Escape") {
          closePaymentModal();
          return;
        }
        if (event.key === "Tab" && paymentModalDialog) {
          trapFocusIn(paymentModalDialog, event);
        }
      });
    }

    const phoneByLang = {
      pl: "tel:+48607354555",
      de: "tel:+48601474040",
      en: "tel:+48668919125"
    };

    function setLanguage(lang) {
      const dict = translations[lang] || translations.pl;
      document.documentElement.lang = lang;
      document.title = dict.title;
      const description = document.querySelector('meta[name="description"]');
      if (description) description.setAttribute("content", dict.description);
      document.querySelectorAll("[data-i18n]").forEach((node) => {
        const key = node.dataset.i18n;
        if (dict[key]) node.textContent = dict[key];
      });
      document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
        const key = node.dataset.i18nAriaLabel;
        if (dict[key]) node.setAttribute("aria-label", dict[key]);
      });
      document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
        const key = node.dataset.i18nAlt;
        if (dict[key]) node.setAttribute("alt", dict[key]);
      });
      document.querySelectorAll("[data-call-link]").forEach((node) => {
        node.setAttribute("href", phoneByLang[lang] || phoneByLang.pl);
      });
      document.querySelectorAll(".lang-switcher button").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.lang === lang);
        button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
      });
      document.querySelectorAll(".contact-variant").forEach((node) => {
        node.hidden = node.dataset.contactLang !== lang;
      });
      document.querySelectorAll(".gallery-clean").forEach((gallery) => {
        const images = gallery.querySelectorAll(".gallery-clean-track img");
        images.forEach((img, imgIndex) => {
          const rawAlt = (img.getAttribute("alt") || "").trim();
          const label = rawAlt && !/^Galeria Dom Latarnika \d+$/i.test(rawAlt)
            ? rawAlt
            : `${dict.gallery_image_fallback} ${imgIndex + 1}`;
          img.setAttribute("aria-label", `${label}. ${dict.gallery_open_hint}`);
        });
        if (typeof gallery._restartAutoMotion === "function") gallery._restartAutoMotion();
      });
      renderAreaGalleries(lang);
      renderRooms(lang);
      renderAmenities(lang);
      renderSharedSpaces(lang);
      if (roomModal && !roomModal.hidden) {
        const room = roomTypes[roomModalIndex];
        if (room) {
          roomModalBody.innerHTML = buildRoomModalContent(room, lang);
          bindRoomModalThumbs(room);
        }
      }
      updateExternalLinkLabels(dict);
      updateMenuToggleLabel(lang);
      heroStatus.textContent = formatMessage(dict.hero_slide_status, {
        current: slideIndex + 1,
        total: slides.length
      });
      if (hasInitializedLanguage) pageStatus.textContent = dict.language_changed_status;
      hasInitializedLanguage = true;
      localStorage.setItem("dom_latarnika_lang", lang);
    }

    document.querySelectorAll(".lang-switcher button").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    revealItems.forEach((item) => revealObserver.observe(item));

    loadA11yPrefs();
    document.querySelectorAll(".gallery-clean").forEach(initCleanGallery);

    function getDefaultLanguage() {
      const saved = localStorage.getItem("dom_latarnika_lang");
      if (saved) return saved;
      const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
      if (browserLang.startsWith("de")) return "de";
      if (browserLang.startsWith("pl")) return "pl";
      return "en";
    }

    function initTestimonialCarousel() {
      const carousel = document.getElementById("testimonials-carousel");
      const dotsContainer = document.getElementById("carousel-dots");

      if (!carousel) return;

      const cards = Array.from(carousel.querySelectorAll(".testimonial-card"));
      let currentIndex = 0;
      let autoRotateInterval;

      function createDots() {
        cards.forEach((_, i) => {
          const dot = document.createElement("button");
          dot.className = `carousel-dot ${i === 0 ? "active" : ""}`;
          dot.setAttribute("aria-label", `Opinia ${i + 1}`);
          dot.onclick = () => {
            goToSlide(i);
            resetAutoRotate();
          };
          dotsContainer.appendChild(dot);
        });
      }

      function goToSlide(index) {
        currentIndex = index % cards.length;
        updateCarousel();
      }

      function updateCarousel() {
        cards.forEach((card, i) => {
          card.classList.toggle("active", i === currentIndex);
        });
        document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
          dot.classList.toggle("active", i === currentIndex);
        });
      }

      function autoRotate() {
        goToSlide((currentIndex + 1) % cards.length);
      }

      function resetAutoRotate() {
        clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(autoRotate, 5000);
      }

      createDots();
      updateCarousel();
      autoRotateInterval = setInterval(autoRotate, 5000);
    }

    // Floating booking button scroll visibility
    const floatingBtn = document.getElementById("floating-booking-btn");
    if (floatingBtn) {
      let isVisible = false;
      const heroSection = document.querySelector(".hero");
      const showThreshold = heroSection?.offsetHeight || 600;

      window.addEventListener("scroll", () => {
        const shouldShow = window.scrollY > showThreshold;
        if (shouldShow && !isVisible) {
          floatingBtn.hidden = false;
          isVisible = true;
        } else if (!shouldShow && isVisible) {
          floatingBtn.hidden = true;
          isVisible = false;
        }
      }, { passive: true });
    }

    // ---- Nagłówek: kurczenie przy przewijaniu ----
    const siteHeader = document.getElementById("site-header");
    if (siteHeader) {
      const onScrollHeader = () => {
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
      };
      window.addEventListener("scroll", onScrollHeader, { passive: true });
      onScrollHeader();
    }

    // ---- Tablica Facebooka: ładowana dopiero po zgodzie (RODO) ----
    const fbEmbed = document.getElementById("fb-embed");
    if (fbEmbed) {
      let fbLoaded = false;

      function socialConsentGranted() {
        try {
          const consent = JSON.parse(localStorage.getItem("domLatarnika_cookieConsent") || "null");
          return Boolean(consent && (consent.social || consent.analytics));
        } catch {
          return false;
        }
      }

      function loadFacebookEmbed() {
        if (fbLoaded) return;
        fbLoaded = true;
        fbEmbed.classList.add("is-loaded");
        const pageUrl = fbEmbed.dataset.fbPage || "https://www.facebook.com/DomLatarnika";
        const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
        const src = "https://www.facebook.com/plugins/page.php?href=" +
          encodeURIComponent(pageUrl) +
          "&tabs=timeline&width=380&height=640&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true";
        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.title = "Facebook Dom Latarnika";
        iframe.width = "100%";
        iframe.height = "640";
        iframe.loading = "lazy";
        iframe.style.border = "0";
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameborder", "0");
        iframe.allow = "encrypted-media";

        // Jeśli przeglądarka/rozszerzenie zablokuje ramkę Facebooka — wróć do placeholdera z linkiem.
        iframe.addEventListener("error", showFbFallback);

        fbEmbed.innerHTML = "";
        fbEmbed.appendChild(iframe);

        // Zawsze widoczny link zapasowy pod tablicą (działa nawet gdy iframe jest pusty/zablokowany).
        const fallback = document.createElement("a");
        fallback.className = "fb-embed-fallback";
        fallback.href = pageUrl.replace(/\/?$/, "/") + "?locale=pl_PL";
        fallback.target = "_blank";
        fallback.rel = "noopener";
        fallback.textContent = dict.fb_embed_fallback || "Nie widać tablicy? Otwórz nasz profil na Facebooku";
        fbEmbed.appendChild(fallback);
      }

      function showFbFallback() {
        const dict = translations[document.documentElement.lang || "pl"] || translations.pl;
        const pageUrl = fbEmbed.dataset.fbPage || "https://www.facebook.com/DomLatarnika";
        fbEmbed.classList.remove("is-loaded");
        fbEmbed.innerHTML = `
          <div class="fb-embed-placeholder">
            <div class="fb-embed-fb-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H17V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.8v8h3.2z"/></svg>
            </div>
            <strong>${dict.fb_embed_title || "Tablica na Facebooku"}</strong>
            <p>${dict.fb_embed_blocked || "Twoja przeglądarka zablokowała osadzoną tablicę. Otwórz nasz profil bezpośrednio na Facebooku."}</p>
            <div class="fb-embed-actions">
              <a class="button button-primary" href="${pageUrl.replace(/\/?$/, "/")}?locale=pl_PL" target="_blank" rel="noopener">${dict.fb_embed_open || "Otwórz w nowej karcie"}</a>
            </div>
          </div>`;
      }

      const fbLoadBtn = document.getElementById("fb-embed-load");
      if (fbLoadBtn) {
        fbLoadBtn.addEventListener("click", () => {
          if (window.CookieConsent && typeof window.CookieConsent.grantSocial === "function") {
            window.CookieConsent.grantSocial();
          }
          loadFacebookEmbed();
        });
      }

      if (socialConsentGranted()) loadFacebookEmbed();
      window.addEventListener("dl:social-consent", loadFacebookEmbed);
    }

    initTestimonialCarousel();
    setLanguage(getDefaultLanguage());
    applyA11yPrefs();
    syncMenuState();
    showSlide(0);
    startHeroAutoplay();

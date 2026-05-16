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
        title: "Dom Latarnika - spokojny pobyt nad morzem w Grzybowie",
        description: "Dom Latarnika w Grzybowie - komfortowe pokoje i studia, śniadania na miejscu, spokojna lokalizacja blisko morza i wygodna rezerwacja online.",
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
        nav_breakfast: "Śniadania",
        nav_area: "Grzybowo i okolice",
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
        hero_kicker: "Pensjonat Dom Latarnika",
        hero_title: "Udane wakacje nad Bałtykiem",
        hero_text: "Spokojny wypoczynek w Grzybowie, blisko morza, z komfortowymi pokojami, śniadaniami i wygodną rezerwacją online.",
        panel_title: "Najważniejsze informacje",
        panel_text: "Najważniejsze rzeczy w jednym miejscu, przed planowaniem pobytu.",
        panel_location_label: "Lokalizacja",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Odległość od morza",
        panel_sea_value: "Około 500 metrów od plaży.",
        panel_breakfast_label: "Śniadania",
        panel_breakfast_value: "śniadania serwowane na miejscu",
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
        offer_text1: "Kameralny obiekt w spokojnej części Grzybowa, około 500 metrów od plaży i blisko głównego deptaka.",
        offer_text2: "Na gości czekają pokoje i studia z łazienkami, praktyczne wyposażenie oraz udogodnienia przydatne podczas dłuższego pobytu.",
        offer_item1: "500 m od plaży",
        offer_item2: "Pokoje i studia z łazienkami",
        offer_item3: "Kuchnia, leżaki, parawany i pralka",
        offer_item4: "Spokojna okolica blisko centrum Grzybowa",
        area_kicker: "Okolica",
        area_title: "Grzybowo i dojazd",
        area_text: "Grzybowo to spokojna nadmorska miejscowość, idealna na plażowanie, spacery i rodzinne wycieczki rowerowe. Dom Latarnika znajduje się blisko plaży, a okolica pozwala wygodnie odpoczywać i odkrywać wybrzeże w spokojnym tempie.",
        area_map_alt: "Stylizowana mapa Grzybowa, Dźwirzyna i Kołobrzegu",
        area_badge_score: "4,6",
        area_badge_label: "Spokojna okolica",
        area_score_button_aria: "Pokaż informacje o spokojnej okolicy",
        area_item1_title: "Plaża i atrakcje",
        area_item1_text: "Szeroka plaża, spacery i nadmorskie atrakcje w okolicy.",
        area_item1_button: "Zobacz atrakcje",
        area_item2_title: "Trasy rowerowe",
        area_item2_text: "Rodzinne przejażdżki i ciekawe trasy w stronę Kołobrzegu oraz Dźwirzyna.",
        area_item2_button: "Zobacz trasy",
        area_item3_title: "Transport",
        area_item3_text: "Sprawdź trasę do Domu Latarnika i wygodnie zaplanuj dojazd.",
        area_item3_button: "Sprawdź dojazd",
        area_modal_close_aria: "Zamknij okno sekcji okolicy",
        area_score_modal_aria: "Spokojna okolica",
        area_score_modal_title: "Spokojna okolica",
        area_score_modal_text: "Ocena lokalizacji 4,6 podkreśla spokojny charakter Grzybowa i wygodne położenie Domu Latarnika. Obiekt znajduje się w cichej części miejscowości, blisko plaży, tras spacerowych i rowerowych, a jednocześnie z dogodnym dojazdem do Kołobrzegu.",
        area_score_point1: "spokojna część Grzybowa,",
        area_score_point2: "około 500 m do plaży,",
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
        area_cycling_modal_aria: "Trasy rowerowe",
        area_cycling_modal_title: "Trasy rowerowe",
        area_cycling_modal_text: "Okolica Grzybowa sprzyja spokojnym wycieczkom rowerowym — od krótkich rodzinnych przejażdżek po dłuższe trasy krajoznawcze.",
        area_cycling_modal_note_title: "Rowery dostępne na miejscu",
        area_cycling_modal_note_text: "Wygodnie zaplanuj trasę i ruszaj prosto z Domu Latarnika.",
        area_route_button: "Sprawdź trasę",
        area_route1_title: "Velo Baltica (R10)",
        area_route1_text: "Nadmorski szlak prowadzący przez Grzybowo. W stronę wschodnią dojedziesz do Kołobrzegu, a na zachód do Dźwirzyna i Rogowa. Trasa jest bezpieczna, utwardzona i prowadzi częściowo przez lasy.",
        area_route1_tag1: "nadmorska",
        area_route1_tag2: "utwardzona",
        area_route1_tag3: "rodzinna",
        area_route2_title: "Trasa „Ku Słońcu”",
        area_route2_text: "Licząca około 30 km pętla: Kołobrzeg – Grzybowo – Dźwirzyno – Karcino – Sarbia – Drzonowo – Nowogardek – Stary Borek – Kołobrzeg. Dobra propozycja na dłuższą, krajoznawczą wycieczkę rowerową.",
        area_route2_tag1: "około 30 km",
        area_route2_tag2: "pętla",
        area_route2_tag3: "krajoznawcza",
        area_route3_title: "Kołobrzeg – Grzybowo – Dźwirzyno",
        area_route3_text: "Popularny, utwardzony odcinek wzdłuż drogi wojewódzkiej nr 102. Zapewnia szybkie i wygodne połączenie między miejscowościami, dobre także na krótszą rodzinną przejażdżkę.",
        area_route3_tag1: "popularna",
        area_route3_tag2: "utwardzona",
        area_route3_tag3: "szybkie połączenie",
        rooms_kicker: "Pokoje i studia",
        rooms_title: "Wnętrza stworzone do spokojnego wypoczynku",
        rooms_text: "Jasne, przytulne pokoje i studia w nadmorskim stylu — idealne na komfortowy pobyt we dwoje, z rodziną lub na dłuższy urlop.",
        room1_title: "Pokój dwuosobowy",
        room1_text: "Przytulna przestrzeń dla dwóch osób, urządzona z myślą o spokojnym wypoczynku blisko morza.",
        room2_title: "Pokój marynistyczny",
        room2_text: "Jasne wnętrze z subtelnym morskim charakterem, wygodnym układem i kameralną atmosferą.",
        room3_title: "Studio rodzinne",
        room3_text: "Więcej przestrzeni i swobody — idealne rozwiązanie dla rodzin oraz osób planujących dłuższy pobyt.",
        breakfast_kicker: "Śniadania",
        breakfast_title: "Dobry początek dnia",
        breakfast_text1: "Śniadania serwujemy na miejscu w wygodnej formule — z półmiskami podawanymi do stolika oraz dodatkami w formie stołu szwedzkiego.",
        breakfast_text2: "W słoneczne poranki goście mogą skorzystać także z tarasu przed budynkiem.",
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
        rules: "Regulamin"
      },
      de: {
        title: "Dom Latarnika - ruhiger Aufenthalt am Meer in Grzybowo",
        description: "Dom Latarnika in Grzybowo - komfortable Zimmer und Studios, Frühstück vor Ort, ruhige Lage nahe am Meer und bequeme Online-Buchung.",
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
        nav_breakfast: "Frühstück",
        nav_area: "Grzybowo und Umgebung",
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
        hero_kicker: "Pension Dom Latarnika",
        hero_title: "Gelungener Urlaub an der Ostsee",
        hero_text: "Erholsame Tage in Grzybowo, nahe am Meer, mit komfortablen Zimmern, Frühstück und einer bequemen Online-Buchung.",
        panel_title: "Wichtige Informationen",
        panel_text: "Die wichtigsten Punkte an einem Ort, noch vor der Planung des Aufenthalts.",
        panel_location_label: "Lage",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Entfernung zum Meer",
        panel_sea_value: "Ca. 500 Meter vom Strand entfernt.",
        panel_breakfast_label: "Frühstück",
        panel_breakfast_value: "Frühstück direkt im Haus",
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
        offer_text1: "Ein kleines Haus in einem ruhigen Teil von Grzybowo, etwa 500 Meter vom Strand und nahe der Hauptpromenade gelegen.",
        offer_text2: "Auf die Gäste warten Zimmer und Studios mit Bad, praktische Ausstattung und Annehmlichkeiten, die bei längeren Aufenthalten besonders nützlich sind.",
        offer_item1: "500 m vom Strand",
        offer_item2: "Zimmer und Studios mit Bad",
        offer_item3: "Küche, Liegestühle, Windschutz und Waschmaschine",
        offer_item4: "Ruhige Lage nahe dem Zentrum von Grzybowo",
        area_kicker: "Umgebung",
        area_title: "Grzybowo und Anreise",
        area_text: "Grzybowo ist ein ruhiger Küstenort, ideal für Strand, Spaziergänge und Fahrradausflüge mit der Familie. Dom Latarnika liegt nah am Strand und die Umgebung lädt dazu ein, die Küste entspannt zu entdecken.",
        area_map_alt: "Stilisierte Karte von Grzybowo, Dźwirzyno und Kołobrzeg",
        area_badge_score: "4,6",
        area_badge_label: "Ruhige Umgebung",
        area_score_button_aria: "Informationen zur ruhigen Umgebung anzeigen",
        area_item1_title: "Strand und Attraktionen",
        area_item1_text: "Breiter Strand, Spaziergänge und Attraktionen am Meer in der Umgebung.",
        area_item1_button: "Attraktionen ansehen",
        area_item2_title: "Radwege",
        area_item2_text: "Familienfahrten und schöne Routen in Richtung Kołobrzeg und Dźwirzyno.",
        area_item2_button: "Radwege ansehen",
        area_item3_title: "Transport",
        area_item3_text: "Prüfen Sie die Route zum Dom Latarnika und planen Sie die Anreise bequem.",
        area_item3_button: "Anreise prüfen",
        area_modal_close_aria: "Fenster der Umgebung schließen",
        area_score_modal_aria: "Ruhige Umgebung",
        area_score_modal_title: "Ruhige Umgebung",
        area_score_modal_text: "Die Lagebewertung 4,6 unterstreicht den ruhigen Charakter von Grzybowo und die günstige Lage des Dom Latarnika. Das Haus liegt in einem stillen Teil des Ortes, nah am Strand sowie an Spazier- und Radwegen und zugleich mit bequemer Verbindung nach Kołobrzeg.",
        area_score_point1: "ruhiger Teil von Grzybowo,",
        area_score_point2: "etwa 500 m bis zum Strand,",
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
        area_cycling_modal_aria: "Radwege",
        area_cycling_modal_title: "Radwege",
        area_cycling_modal_text: "Die Umgebung von Grzybowo eignet sich ideal für ruhige Radtouren — von kurzen Familienfahrten bis zu längeren landschaftlichen Strecken.",
        area_cycling_modal_note_title: "Fahrräder vor Ort verfügbar",
        area_cycling_modal_note_text: "Planen Sie Ihre Route bequem und starten Sie direkt am Dom Latarnika.",
        area_route_button: "Route prüfen",
        area_route1_title: "Velo Baltica (R10)",
        area_route1_text: "Der Küstenweg führt durch Grzybowo. Nach Osten fahren Sie bis Kołobrzeg, nach Westen bis Dźwirzyno und Rogowo. Die Strecke ist sicher, befestigt und verläuft teilweise durch Wälder.",
        area_route1_tag1: "Küste",
        area_route1_tag2: "befestigt",
        area_route1_tag3: "familienfreundlich",
        area_route2_title: "Route „Ku Słońcu”",
        area_route2_text: "Eine rund 30 km lange Runde: Kołobrzeg – Grzybowo – Dźwirzyno – Karcino – Sarbia – Drzonowo – Nowogardek – Stary Borek – Kołobrzeg. Eine gute Wahl für eine längere, landschaftlich reizvolle Fahrradtour.",
        area_route2_tag1: "ca. 30 km",
        area_route2_tag2: "Rundweg",
        area_route2_tag3: "landschaftlich",
        area_route3_title: "Kołobrzeg – Grzybowo – Dźwirzyno",
        area_route3_text: "Ein beliebter, befestigter Abschnitt entlang der Woiwodschaftsstraße 102. Er bietet eine schnelle und bequeme Verbindung zwischen den Orten und eignet sich auch für eine kürzere Familienfahrt.",
        area_route3_tag1: "beliebt",
        area_route3_tag2: "befestigt",
        area_route3_tag3: "schnelle Verbindung",
        rooms_kicker: "Zimmer und Studios",
        rooms_title: "Innenräume für ruhige Erholung geschaffen",
        rooms_text: "Helle, gemütliche Zimmer und Studios im Küstenstil — ideal für einen komfortablen Aufenthalt zu zweit, mit der Familie oder für einen längeren Urlaub.",
        room1_title: "Doppelzimmer",
        room1_text: "Ein gemütlicher Raum für zwei Personen, gestaltet für ruhige Erholung in Meeresnähe.",
        room2_title: "Maritimes Zimmer",
        room2_text: "Ein heller Raum mit feinem Küstencharakter, praktischem Grundriss und ruhiger Atmosphäre.",
        room3_title: "Familienstudio",
        room3_text: "Mehr Platz und mehr Freiheit — eine gute Lösung für Familien und für Gäste mit längerem Aufenthalt.",
        breakfast_kicker: "Frühstück",
        breakfast_title: "Ein guter Start in den Tag",
        breakfast_text1: "Das Frühstück wird direkt vor Ort in einer angenehmen Form serviert — mit Platten am Tisch und zusätzlichen Angeboten als Buffet.",
        breakfast_text2: "An sonnigen Morgen können Gäste auch die Terrasse vor dem Gebäude nutzen.",
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
        rules: "Hausordnung"
      },
      en: {
        title: "Dom Latarnika - peaceful seaside stay in Grzybowo",
        description: "Dom Latarnika in Grzybowo - comfortable rooms and studios, breakfast on site, a peaceful location near the sea and convenient online booking.",
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
        nav_breakfast: "Breakfast",
        nav_area: "Grzybowo and surroundings",
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
        hero_kicker: "Dom Latarnika Guesthouse",
        hero_title: "A relaxing holiday by the Baltic Sea",
        hero_text: "A peaceful stay in Grzybowo, close to the sea, with comfortable rooms, breakfast and convenient online booking.",
        panel_title: "Key information",
        panel_text: "The most important details in one place before planning your stay.",
        panel_location_label: "Location",
        panel_location_value: "Grzybowo, ul. Nadmorska 65A",
        panel_sea_label: "Distance to the sea",
        panel_sea_value: "Approx. 500 metres from the beach.",
        panel_breakfast_label: "Breakfast",
        panel_breakfast_value: "breakfast served on site",
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
        offer_text1: "A cosy property in a peaceful part of Grzybowo, around 500 metres from the beach and close to the main promenade.",
        offer_text2: "Guests can choose rooms and studios with private bathrooms, practical equipment and amenities useful during longer stays.",
        offer_item1: "500 m from the beach",
        offer_item2: "Rooms and studios with private bathrooms",
        offer_item3: "Kitchen, deckchairs, windbreaks and washing machine",
        offer_item4: "Quiet area close to the centre of Grzybowo",
        area_kicker: "Surroundings",
        area_title: "Grzybowo and access",
        area_text: "Grzybowo is a peaceful seaside village, ideal for beach time, walks and family cycling trips. Dom Latarnika is close to the beach and the area makes it easy to relax and explore the coast at a calm pace.",
        area_map_alt: "Illustrated map of Grzybowo, Dźwirzyno and Kołobrzeg",
        area_badge_score: "4.6",
        area_badge_label: "Peaceful area",
        area_score_button_aria: "Show details about the peaceful area",
        area_item1_title: "Beach and attractions",
        area_item1_text: "Wide beach, walks and seaside attractions nearby.",
        area_item1_button: "See attractions",
        area_item2_title: "Cycling routes",
        area_item2_text: "Family rides and scenic routes towards Kołobrzeg and Dźwirzyno.",
        area_item2_button: "See routes",
        area_item3_title: "Transport",
        area_item3_text: "Check the route to Dom Latarnika and plan your arrival with ease.",
        area_item3_button: "Check directions",
        area_modal_close_aria: "Close surroundings dialog",
        area_score_modal_aria: "Peaceful area",
        area_score_modal_title: "Peaceful area",
        area_score_modal_text: "The location score of 4.6 highlights the peaceful character of Grzybowo and the convenient setting of Dom Latarnika. The property is in a quiet part of the village, close to the beach, walking and cycling routes, while still offering easy access to Kołobrzeg.",
        area_score_point1: "quiet part of Grzybowo,",
        area_score_point2: "around 500 m to the beach,",
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
        area_cycling_modal_aria: "Cycling routes",
        area_cycling_modal_title: "Cycling routes",
        area_cycling_modal_text: "The Grzybowo area is ideal for calm cycling trips — from short family rides to longer scenic routes.",
        area_cycling_modal_note_title: "Bikes available on site",
        area_cycling_modal_note_text: "Plan your route comfortably and set off straight from Dom Latarnika.",
        area_route_button: "Check route",
        area_route1_title: "Velo Baltica (R10)",
        area_route1_text: "A coastal route running through Grzybowo. Head east towards Kołobrzeg or west towards Dźwirzyno and Rogowo. The route is safe, paved and partly leads through forest areas.",
        area_route1_tag1: "coastal",
        area_route1_tag2: "paved",
        area_route1_tag3: "family-friendly",
        area_route2_title: "Ku Słońcu route",
        area_route2_text: "A loop of around 30 km: Kołobrzeg – Grzybowo – Dźwirzyno – Karcino – Sarbia – Drzonowo – Nowogardek – Stary Borek – Kołobrzeg. A good choice for a longer scenic cycling trip.",
        area_route2_tag1: "around 30 km",
        area_route2_tag2: "loop",
        area_route2_tag3: "scenic",
        area_route3_title: "Kołobrzeg – Grzybowo – Dźwirzyno",
        area_route3_text: "A popular paved section along regional road 102. It offers a quick and convenient connection between the towns and also works well for a shorter family ride.",
        area_route3_tag1: "popular",
        area_route3_tag2: "paved",
        area_route3_tag3: "quick link",
        rooms_kicker: "Rooms and studios",
        rooms_title: "Interiors created for peaceful rest",
        rooms_text: "Bright, cosy rooms and studios with a seaside feel — ideal for a comfortable stay for two, with family or for a longer holiday.",
        room1_title: "Double room",
        room1_text: "A cosy space for two, arranged with peaceful relaxation near the sea in mind.",
        room2_title: "Marine-style room",
        room2_text: "A bright interior with a subtle seaside character, a comfortable layout and a calm atmosphere.",
        room3_title: "Family studio",
        room3_text: "More space and more freedom — a practical choice for families and for guests planning a longer stay.",
        breakfast_kicker: "Breakfast",
        breakfast_title: "A good start to the day",
        breakfast_text1: "Breakfast is served on site in a convenient format — platters brought to the table with additional items offered as a buffet.",
        breakfast_text2: "On sunny mornings guests can also use the terrace in front of the building.",
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
        rules: "Rules"
      }
    };

    const attractionCards = [
      {
        key: "grzybowo-beach",
        titleKey: "area_beach_card1_title",
        subtitleKey: "area_beach_card1_subtitle",
        images: [
          "img/morzeIMG_5793.jpeg",
          "img/morzeIMG_5792.jpeg",
          "img/morzeIMG_5791.jpeg",
          "img/morzeIMG_5787.jpeg"
        ]
      },
      {
        key: "seaside-walks",
        titleKey: "area_beach_card2_title",
        subtitleKey: "area_beach_card2_subtitle",
        images: [
          "img/morzeIMG_5788.jpeg",
          "img/morzeIMG_5790.jpeg",
          "img/morzeIMG_5794.jpeg"
        ]
      },
      {
        key: "kolobrzeg-area",
        titleKey: "area_beach_card3_title",
        subtitleKey: "area_beach_card3_subtitle",
        images: [
          "img/morzeIMG_5789.jpeg",
          "img/morzeIMG_5794.jpeg",
          "img/morzeIMG_5790.jpeg"
        ]
      }
    ];

    const cyclingRoutes = [
      {
        image: "img/local-area/cycling/coastal-route.svg",
        titleKey: "area_route1_title",
        textKey: "area_route1_text",
        tagKeys: ["area_route1_tag1", "area_route1_tag2", "area_route1_tag3"],
        mapUrl: "https://www.google.com/maps/search/Velo+Baltica+R10+Grzybowo+Ko%C5%82obrzeg+D%C5%BAwirzyno"
      },
      {
        image: "img/local-area/cycling/municipality-routes.svg",
        titleKey: "area_route2_title",
        textKey: "area_route2_text",
        tagKeys: ["area_route2_tag1", "area_route2_tag2", "area_route2_tag3"],
        mapUrl: "https://www.google.com/maps/search/Trasa+rowerowa+Ku+S%C5%82o%C5%84cu+Ko%C5%82obrzeg+Grzybowo+D%C5%BAwirzyno"
      },
      {
        image: "img/local-area/cycling/route-dzwirzyno.svg",
        titleKey: "area_route3_title",
        textKey: "area_route3_text",
        tagKeys: ["area_route3_tag1", "area_route3_tag2", "area_route3_tag3"],
        mapUrl: "https://www.google.com/maps/search/%C5%9Bcie%C5%BCka+rowerowa+Ko%C5%82obrzeg+Grzybowo+D%C5%BAwirzyno+DW+102"
      }
    ];

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

    function renderAreaCyclingRoutes(dict) {
      const bikeIcon = `
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="15.5" cy="31.5" r="6.5" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="32.5" cy="31.5" r="6.5" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15.5 31.5L23 18H28.5L32.5 31.5M23 18L30 31.5M19.5 18H12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M29.5 13.5H34.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
      return cyclingRoutes.map((route) => {
        const title = dict[route.titleKey] || "";
        const text = dict[route.textKey] || "";
        const tags = route.tagKeys.map((key) => `<li>${dict[key] || ""}</li>`).join("");
        return `
          <article class="area-route-card area-modal-item">
            <div class="area-route-visual">
              <img src="${route.image}" alt="${title}">
              <span class="area-route-icon">${bikeIcon}</span>
            </div>
            <div class="area-route-body">
              <strong>${title}</strong>
              <p>${text}</p>
              <ul class="area-route-tags">${tags}</ul>
              <div class="area-route-actions">
                <a class="button button-secondary" href="${route.mapUrl}" target="_blank" rel="noopener noreferrer">${dict.area_route_button || ""}</a>
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
      const cyclingGrid = document.querySelector('[data-area-grid="cycling"]');
      if (beachGrid) beachGrid.innerHTML = renderAreaAttractions(dict);
      if (cyclingGrid) cyclingGrid.innerHTML = renderAreaCyclingRoutes(dict);
      if (activeAreaModal === areaModalMap.beach) {
        startAttractionRotators();
      } else {
        stopAttractionRotators();
      }
    }

    const areaModalMap = {
      beach: document.getElementById("area-beach-modal"),
      cycling: document.getElementById("area-cycling-modal"),
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

    const revealItems = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    revealItems.forEach((item) => observer.observe(item));

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

    initTestimonialCarousel();
    setLanguage(getDefaultLanguage());
    applyA11yPrefs();
    syncMenuState();
    showSlide(0);
    startHeroAutoplay();

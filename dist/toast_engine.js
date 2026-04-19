(function() {
    // Chargement CSS
    if (!document.getElementById('toastify-css')) {
        const link = document.createElement('link');
        link.id = 'toastify-css';
        link.rel = 'stylesheet';
        link.href = '/toastify_lib/toastify.css';
        document.head.appendChild(link);
    }

    // Chargement JS
    if (typeof Toastify === "undefined") {
        const script = document.createElement("script");
        script.src = "/toastify_lib/toastify.js";
        script.onload = () => {
            // Hello console
            console.log(
                "%c🍞 TOASTIFY%c Le moteur a été chargé avec succès !", 
                "background-color: #ff9800; color: white; font-weight: bold; border-radius: 4px; padding: 2px 5px;", 
                "color: #ff9800; font-weight: bold;"
            );
            initToastify();
        };
        document.head.appendChild(script);
    } else {
        initToastify();
    }

    // Vérification de la disponibilité de l'objet hass
    function initToastify() {
        const checkHass = setInterval(() => {
            const main = document.querySelector("home-assistant");
            if (main && main.hass) {
                setupListener(main.hass);
                clearInterval(checkHass);
            }
        }, 1000);
    }

    // Thèmes de notifications prédéfinies
    const TOAST_THEMES = {
        "success": "#00b09b",
        "info": "#03a9f4",
        "warning": "#ff9800",
        "error": "#f44336",
        "alert": "#e91e63",
        "default": "rgba(50, 50, 50, 0.9)"
    };

    // Fonction pour déterminer si le message doit être écrit en noir ou en blanc
    // en fonction du thème du toast
    function getContrastColor(hexColor) {
        if (!hexColor || hexColor.includes("gradient")) return "#ffffff";
        
        // Si thème RGBA ou RGB
        if (hexColor.startsWith("rgba") || hexColor.startsWith("rgb")) {
            return "#ffffff";
        }

        // Conversion Hex en RGB
        const hex = hexColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calcul de la luminosité (formule standard YIQ)
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? "#000000" : "#ffffff";
    }

    // Gestionnaire d'actions (URL ou Service HA)
    function executeAction(actionObj) {
        if (!actionObj) return;

        // On gère si c'est une simple string (compatibilité) ou un objet
        const action = (typeof actionObj === 'string') ? actionObj.trim() : actionObj.action?.trim();
        const serviceData = actionObj.action_data || {};

        if (!action) return;

        // URL
        if (action.startsWith("http") || action.startsWith("/")) {
            window.open(action, "_blank");
        } 
        // Appel de service Home Assistant
        else if (action.includes(".")) {
            const [domain, service] = action.split(".");
            const hass = document.querySelector("home-assistant")?.hass;
            
            if (hass) {
                hass.callService(domain, service, serviceData);
            }
        }
    }

    function createToast(data) {
        const d = data;

        if (!d.message) return;

        const visibility = d.visibility || "dashboard";
        // On vérifie où se trouve l'utilisateur
        const isDashboard = window.location.pathname.includes("lovelace") || 
                            window.location.pathname.includes("dashboard");

        // Condition de visibilité
        const shouldShow = (visibility === "all" || (visibility === "dashboard" && isDashboard));

        if (shouldShow) {
            // Thème
            const colorInput = d.color ? d.color.toLowerCase() : "default";
            const finalColor = TOAST_THEMES[colorInput] || d.color || TOAST_THEMES["default"];
            const textColor = getContrastColor(finalColor);

            // Container du toast
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.flexDirection = "row";
            container.style.alignItems = "center";
            container.style.flexGrow = "1";
            container.style.position = "relative";

            // Avatar
            if (d.icon && d.icon.trim() !== "") {
                let iconElement;
                if (d.icon.startsWith("mdi:")) {
                    // Si c'est un MDI, on crée un composant icône Home Assistant
                    iconElement = document.createElement("ha-icon");
                    iconElement.setAttribute("icon", d.icon);
                    iconElement.style.setProperty('--mdc-icon-size', '40px'); // Définit la taille de l'icône
                    iconElement.style.width = "40px";  // Définit la largeur du conteneur
                    iconElement.style.height = "40px"; // Définit la hauteur du conteneur
                    iconElement.style.color = textColor; // Elle prend la couleur du texte
                } else {
                    iconElement = document.createElement("img");
                    iconElement.src = d.icon;
                    iconElement.style.width = "48px";
                    iconElement.style.height = "48px";
                    iconElement.style.borderRadius = "10px";
                    iconElement.style.objectFit = "cover";
                    iconElement.style.boxShadow = "0 2px 5px rgba(0,0,0,0.15)";
                }
                iconElement.style.marginRight = "14px";
                iconElement.style.flexShrink = "0";
                container.appendChild(iconElement);
            }

            // --- Container pour le Texte et le Bouton ---
            const textContainer = document.createElement("div");
            textContainer.style.display = "flex";
            textContainer.style.flexDirection = "column";
            textContainer.style.justifyContent = "center"; // Centre le contenu verticalement dans sa propre colonne
            textContainer.style.alignItems = "center"; // Garde le texte et bouton alignés à gauche
            textContainer.style.flexGrow = "1"; 
            textContainer.style.paddingRight = "25px";
            
            const textSpan = document.createElement("span");
            textSpan.innerText = d.message;
            textSpan.style.fontSize = "1em";
            textSpan.style.lineHeight = "1.2";
            textSpan.style.fontWeight = "600";
            textSpan.style.color = textColor;
            // On ajoute le texte dans le textContainer (et pas directement dans container)
            textContainer.appendChild(textSpan);


            const toastInstance = Toastify({
                node: container,
                duration: d.duration || 5000,
                selector: document.body,
                close: d.close === true || d.close === "true",
                gravity: d.gravity || "top",
                position: d.position || "right",
                // avatar: d.icon || "", // Ajouté au node
                stopOnFocus: true,
                oldestFirst: d.oldestFirst === true || d.oldestFirst === "true",
                style: { 
                    background: finalColor,
                    color: textColor,
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 9999999,
                    position: "fixed",
                    cursor: "default",
                    display: "flex",
                    padding: "8px"
                },
                onClick: function() {
                    toastInstance.hideToast();
                },
                callback: function() {
                    if (d.callback) executeAction(d.callback);
                },
            });

            // Bouton
            if (d.onClick) {
                const btn = document.createElement("button");
                btn.innerText = d.button_label || "VOIR";
                btn.style.marginTop = "8px";
                btn.style.padding = "4px 12px";
                btn.style.background = "rgba(0, 0, 0, 0.15)";
                btn.style.border = `1px solid ${textColor}`;
                btn.style.color = textColor;
                btn.style.borderRadius = "6px";
                btn.style.fontSize = "0.8em";
                btn.style.cursor = "pointer";

                btn.onmouseenter = () => btn.style.background = "rgba(0, 0, 0, 0.3)";
                btn.onmouseleave = () => btn.style.background = "rgba(0, 0, 0, 0.2)";

                btn.onclick = (e) => {
                    e.stopPropagation();
                    executeAction(d.onClick);
                    setTimeout(() => toastInstance.hideToast(), 1000);
                };
                textContainer.appendChild(btn);
            }

            container.appendChild(textContainer);
            toastInstance.showToast();

            const closeBtn = container.parentElement.querySelector(".toast-close");
            if (closeBtn) {
                closeBtn.style.position = "absolute";
                closeBtn.style.top = "8px";
                closeBtn.style.right = "8px";
                closeBtn.style.opacity = "0.6";
                closeBtn.style.padding = "0";
                closeBtn.style.lineHeight = "1";
            }
        }
    }


    // Abonnement via la commande WebSocket personnalisée
    function setupListener(hass) {
        console.log("[Toastify] Tentative d'abonnement au tunnel sécurisé...");

        hass.connection.subscribeMessage(
            (message) => {
                console.log("[Toastify] Message reçu via tunnel :", message);
                createToast(message);
            },
            { type: "toastify/subscribe" }
        ).then(
            null, // Silencieux si tout va bien
            (err) => console.error("[Toastify] Le tunnel a été refusé par le serveur", err)
        );
    }

    // --- BLOC DE TEST POUR LE README (À supprimer avant la version finale) ---
    
        // Petit délai pour laisser Home Assistant finir de charger son interface
        setTimeout(() => {
            
            // 1. Alerte Critique (Haut - Droite)
            createToast({
                message: "Alerte Sécurité : Mouvement détecté",
                duration: 15000,
                gravity: "top",
                position: "right",
                color: "error",
                icon: "mdi:motion-sensor",
                button_label: "VOIR CAMÉRA",
                close: true,
                onClick: { action: "camera.play_stream" }
            });

            // 2. Succès (Haut - Droite - s'empilera sous le premier)
            createToast({
                message: "✅ Tidjy est bien arrivé à la maison.",
                duration: 15000,
                gravity: "top",
                position: "right",
                color: "success",
                icon: "/toastify_lib/images/uifaces-popular-avatar.jpg",
                button_label: "DISARM ALARM",
                close: true,
                onClick: { action: "alarm_control_panel.alarm_disarm" }
            });

            // 3. Info (Bas - Droite)
            createToast({
                message: "ℹ️ Information : La batterie du téléphone est faible (12%).",
                duration: 15000,
                gravity: "bottom",
                position: "right",
                color: "info",
                close: true
            });

            // 4. Warning (Haut - Gauche)
            createToast({
                message: "⚠️ Attention : Consommation électrique élevée détectée.",
                duration: 15000,
                gravity: "top",
                position: "left",
                color: "warning",
                close: true,
            });

        }, 5000); // 2 secondes de délai après le load
    
})();

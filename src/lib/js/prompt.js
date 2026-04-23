export function showPrompt({ message = "Enter value...", placeholder = "" } = {}) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)"; // Slightly deeper overlay
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
        overlay.style.fontFamily = "'Sohne Buch', 'OpenAI Sans', -apple-system, system-ui, sans-serif";
        overlay.style.backdropFilter = "blur(4px)"; // Adds that modern frosted glass feel

        // Create modal
        const modal = document.createElement("div");
        modal.style.backgroundColor = "#212121"; // Matches body background
        modal.style.padding = "24px";
        modal.style.borderRadius = "12px";
        modal.style.width = "400px"; // Slightly wider for better readability
        modal.style.maxWidth = "90%";
        modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.gap = "16px";
        overlay.appendChild(modal);

        // Message
        const msg = document.createElement("p");
        msg.textContent = message;
        msg.style.color = "#ececec";
        msg.style.fontSize = "16px";
        msg.style.fontWeight = "600"; // Matching .section-title style
        msg.style.margin = "0";
        msg.style.letterSpacing = "0.02em";
        msg.style.fontSynthesis = "none";
        modal.appendChild(msg);

        // Input (Styled like the .input-wrapper)
        const input = document.createElement("input");
        input.placeholder = placeholder;
        input.style.padding = "12px 16px";
        input.style.borderRadius = "8px";
        input.style.border = "0px";
        input.style.outline = "none";
        input.style.backgroundColor = "#2f2f2f"; // Matches .input-wrapper
        input.style.color = "#ececec";
        input.style.fontSize = "14px";
        input.style.transition = "border-color 0.2s";
        input.onfocus = () => (input.style.borderColor = "#676767");
        input.onblur = () => (input.style.borderColor = "#424242");
        modal.appendChild(input);

        // Buttons container
        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";
        btnContainer.style.gap = "12px";
        btnContainer.style.marginTop = "8px";
        modal.appendChild(btnContainer);

        // Cancel button (Styled like .new-chat-btn)
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "10px 18px";
        cancelBtn.style.borderRadius = "8px";
        cancelBtn.style.border = "1px solid #424242";
        cancelBtn.style.backgroundColor = "transparent";
        cancelBtn.style.color = "#ececec";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.fontWeight = "500";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.style.transition = "background-color 0.2s";
        cancelBtn.onmouseenter = () => (cancelBtn.style.backgroundColor = "#2f2f2f");
        cancelBtn.onmouseleave = () => (cancelBtn.style.backgroundColor = "transparent");
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };
        btnContainer.appendChild(cancelBtn);

        // OK button (Styled like .solid-btn)
        const okBtn = document.createElement("button");
        okBtn.textContent = "Continue"; // Matches ChatGPT action phrasing
        okBtn.style.padding = "10px 18px";
        okBtn.style.borderRadius = "8px";
        okBtn.style.border = "none";
        okBtn.style.backgroundColor = "#ececec"; // Light accent
        okBtn.style.color = "#212121"; // Dark text
        okBtn.style.fontSize = "14px";
        okBtn.style.fontWeight = "600";
        okBtn.style.cursor = "pointer";
        okBtn.style.transition = "background-color 0.2s";
        okBtn.onmouseenter = () => (okBtn.style.backgroundColor = "#ffffff");
        okBtn.onmouseleave = () => (okBtn.style.backgroundColor = "#ececec");
        okBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(input.value);
        };
        btnContainer.appendChild(okBtn);

        document.body.appendChild(overlay);

        // Focus input automatically
        input.focus();

        // Handle Enter key
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") okBtn.click();
            if (e.key === "Escape") cancelBtn.click();
        });
    });
}
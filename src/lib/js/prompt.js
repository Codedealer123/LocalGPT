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

export function showAuthPrompt({ initialMode = "signin" } = {}) {
    return new Promise((resolve) => {
        let mode = initialMode === "signup" ? "signup" : "signin";

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
        overlay.style.fontFamily = "'Sohne Buch', 'OpenAI Sans', -apple-system, system-ui, sans-serif";
        overlay.style.backdropFilter = "blur(4px)";

        const modal = document.createElement("div");
        modal.style.backgroundColor = "#212121";
        modal.style.padding = "24px";
        modal.style.borderRadius = "12px";
        modal.style.width = "420px";
        modal.style.maxWidth = "92%";
        modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.gap = "16px";
        overlay.appendChild(modal);

        const title = document.createElement("p");
        title.style.color = "#ececec";
        title.style.fontSize = "16px";
        title.style.fontWeight = "600";
        title.style.margin = "0";
        title.style.letterSpacing = "0.02em";
        modal.appendChild(title);

        const toggleRow = document.createElement("div");
        toggleRow.style.display = "flex";
        toggleRow.style.gap = "8px";
        modal.appendChild(toggleRow);

        const signInTab = document.createElement("button");
        const signUpTab = document.createElement("button");

        for (const button of [signInTab, signUpTab]) {
            button.type = "button";
            button.style.flex = "1";
            button.style.padding = "10px 12px";
            button.style.borderRadius = "8px";
            button.style.border = "1px solid #424242";
            button.style.cursor = "pointer";
            button.style.fontSize = "14px";
            button.style.fontWeight = "600";
        }

        signInTab.textContent = "Sign in";
        signUpTab.textContent = "Sign up";
        toggleRow.appendChild(signInTab);
        toggleRow.appendChild(signUpTab);

        const fieldStack = document.createElement("div");
        fieldStack.style.display = "flex";
        fieldStack.style.flexDirection = "column";
        fieldStack.style.gap = "12px";
        modal.appendChild(fieldStack);

        const nameInput = document.createElement("input");
        const emailInput = document.createElement("input");
        const passwordInput = document.createElement("input");

        const inputs = [nameInput, emailInput, passwordInput];

        for (const input of inputs) {
            input.style.padding = "12px 16px";
            input.style.borderRadius = "8px";
            input.style.border = "0";
            input.style.outline = "none";
            input.style.backgroundColor = "#2f2f2f";
            input.style.color = "#ececec";
            input.style.fontSize = "14px";
        }

        nameInput.placeholder = "Your name";
        nameInput.autocomplete = "name";
        emailInput.placeholder = "you@example.com";
        emailInput.type = "email";
        emailInput.autocomplete = "email";
        passwordInput.placeholder = "Password";
        passwordInput.type = "password";
        passwordInput.autocomplete = "current-password";

        fieldStack.appendChild(nameInput);
        fieldStack.appendChild(emailInput);
        fieldStack.appendChild(passwordInput);

        const helper = document.createElement("p");
        helper.style.color = "#8e8e8e";
        helper.style.fontSize = "12px";
        helper.style.margin = "0";
        modal.appendChild(helper);

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";
        btnContainer.style.gap = "12px";
        btnContainer.style.marginTop = "8px";
        modal.appendChild(btnContainer);

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.type = "button";
        cancelBtn.style.padding = "10px 18px";
        cancelBtn.style.borderRadius = "8px";
        cancelBtn.style.border = "1px solid #424242";
        cancelBtn.style.backgroundColor = "transparent";
        cancelBtn.style.color = "#ececec";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.fontWeight = "500";
        cancelBtn.style.cursor = "pointer";
        btnContainer.appendChild(cancelBtn);

        const submitBtn = document.createElement("button");
        submitBtn.type = "button";
        submitBtn.style.padding = "10px 18px";
        submitBtn.style.borderRadius = "8px";
        submitBtn.style.border = "none";
        submitBtn.style.backgroundColor = "#ececec";
        submitBtn.style.color = "#212121";
        submitBtn.style.fontSize = "14px";
        submitBtn.style.fontWeight = "600";
        submitBtn.style.cursor = "pointer";
        btnContainer.appendChild(submitBtn);

        const refreshMode = () => {
            const isSignUp = mode === "signup";

            title.textContent = isSignUp ? "Create your account" : "Sign in to your account";
            helper.textContent = isSignUp
                ? "Use your name, email, and a password with at least 6 characters."
                : "Sign in with your email and password.";
            submitBtn.textContent = isSignUp ? "Create account" : "Sign in";
            nameInput.style.display = isSignUp ? "block" : "none";
            passwordInput.autocomplete = isSignUp ? "new-password" : "current-password";

            signInTab.style.backgroundColor = !isSignUp ? "#ececec" : "transparent";
            signInTab.style.color = !isSignUp ? "#212121" : "#ececec";
            signUpTab.style.backgroundColor = isSignUp ? "#ececec" : "transparent";
            signUpTab.style.color = isSignUp ? "#212121" : "#ececec";
        };

        const close = (value) => {
            document.body.removeChild(overlay);
            resolve(value);
        };

        signInTab.onclick = () => {
            mode = "signin";
            refreshMode();
        };

        signUpTab.onclick = () => {
            mode = "signup";
            refreshMode();
        };

        cancelBtn.onclick = () => close(null);

        submitBtn.onclick = () => {
            close({
                mode,
                name: nameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
            });
        };

        document.body.appendChild(overlay);
        refreshMode();
        emailInput.focus();

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") cancelBtn.click();
            if (event.key === "Enter") submitBtn.click();
        });
    });
}

export function showConfirm({
    title = "Are you sure?",
    message = "",
    confirmText = "Confirm",
    cancelText = "Cancel",
} = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
        overlay.style.fontFamily = "'Sohne Buch', 'OpenAI Sans', -apple-system, system-ui, sans-serif";
        overlay.style.backdropFilter = "blur(4px)";

        const modal = document.createElement("div");
        modal.style.backgroundColor = "#212121";
        modal.style.padding = "24px";
        modal.style.borderRadius = "12px";
        modal.style.width = "420px";
        modal.style.maxWidth = "92%";
        modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.gap = "12px";
        overlay.appendChild(modal);

        const titleEl = document.createElement("p");
        titleEl.textContent = title;
        titleEl.style.color = "#ececec";
        titleEl.style.fontSize = "16px";
        titleEl.style.fontWeight = "600";
        titleEl.style.margin = "0";
        modal.appendChild(titleEl);

        if (message) {
            const messageEl = document.createElement("p");
            messageEl.textContent = message;
            messageEl.style.color = "#bdbdbd";
            messageEl.style.fontSize = "14px";
            messageEl.style.lineHeight = "1.5";
            messageEl.style.margin = "0";
            modal.appendChild(messageEl);
        }

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";
        btnContainer.style.gap = "12px";
        btnContainer.style.marginTop = "8px";
        modal.appendChild(btnContainer);

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = cancelText;
        cancelBtn.style.padding = "10px 18px";
        cancelBtn.style.borderRadius = "8px";
        cancelBtn.style.border = "1px solid #424242";
        cancelBtn.style.backgroundColor = "transparent";
        cancelBtn.style.color = "#ececec";
        cancelBtn.style.fontSize = "14px";
        cancelBtn.style.fontWeight = "500";
        cancelBtn.style.cursor = "pointer";
        btnContainer.appendChild(cancelBtn);

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.textContent = confirmText;
        confirmBtn.style.padding = "10px 18px";
        confirmBtn.style.borderRadius = "8px";
        confirmBtn.style.border = "none";
        confirmBtn.style.backgroundColor = "#ececec";
        confirmBtn.style.color = "#212121";
        confirmBtn.style.fontSize = "14px";
        confirmBtn.style.fontWeight = "600";
        confirmBtn.style.cursor = "pointer";
        btnContainer.appendChild(confirmBtn);

        const close = (value) => {
            document.body.removeChild(overlay);
            resolve(value);
        };

        cancelBtn.onclick = () => close(false);
        confirmBtn.onclick = () => close(true);

        document.body.appendChild(overlay);
        confirmBtn.focus();

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") cancelBtn.click();
            if (event.key === "Enter") confirmBtn.click();
        });
    });
}

export function showNotice({
    title = "Done",
    message = "",
    buttonText = "OK",
} = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
        overlay.style.fontFamily = "'Sohne Buch', 'OpenAI Sans', -apple-system, system-ui, sans-serif";
        overlay.style.backdropFilter = "blur(4px)";

        const modal = document.createElement("div");
        modal.style.backgroundColor = "#212121";
        modal.style.padding = "24px";
        modal.style.borderRadius = "12px";
        modal.style.width = "440px";
        modal.style.maxWidth = "92%";
        modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.gap = "12px";
        overlay.appendChild(modal);

        const titleEl = document.createElement("p");
        titleEl.textContent = title;
        titleEl.style.color = "#ececec";
        titleEl.style.fontSize = "16px";
        titleEl.style.fontWeight = "600";
        titleEl.style.margin = "0";
        modal.appendChild(titleEl);

        const messageEl = document.createElement("p");
        messageEl.textContent = message;
        messageEl.style.color = "#bdbdbd";
        messageEl.style.fontSize = "14px";
        messageEl.style.lineHeight = "1.6";
        messageEl.style.margin = "0";
        modal.appendChild(messageEl);

        const btnContainer = document.createElement("div");
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";
        btnContainer.style.marginTop = "8px";
        modal.appendChild(btnContainer);

        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.textContent = buttonText;
        okBtn.style.padding = "10px 18px";
        okBtn.style.borderRadius = "8px";
        okBtn.style.border = "none";
        okBtn.style.backgroundColor = "#ececec";
        okBtn.style.color = "#212121";
        okBtn.style.fontSize = "14px";
        okBtn.style.fontWeight = "600";
        okBtn.style.cursor = "pointer";
        btnContainer.appendChild(okBtn);

        const close = () => {
            document.body.removeChild(overlay);
            resolve();
        };

        okBtn.onclick = close;

        document.body.appendChild(overlay);
        okBtn.focus();

        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape" || event.key === "Enter") okBtn.click();
        });
    });
}

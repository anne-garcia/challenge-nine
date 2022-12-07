class Main {

    // Socket
    socket = null;

    // Form elements
    form = null;
    inputFirstName = null;
    inputLastName = null;
    inputProfileImg = null;
    inputEmail = null;
    inputBirthDate = null;
    inputUsername = null;
    inputPassword = null;
    inputPassword2 = null;
    submitBtn = null;

    // Validation requirements
    fieldsUsedSet = null; // set object
    fieldsUsedCount = 0;
    fieldsWithBannedWordSet = null; // set object
    passwordConfirmed = false;
    
    static HandleRegistrationForm() {

        this.socket = io();
        this.form = document.getElementById("UserAccessForm");

        // We're using a set to capture each unique form field that needs to be filled out in some manner.
        this.fieldsUsedSet = new Set();

        // We're not validating any entry into the "password confirmation" field, because that will be checked implicitely.
        // Also deduct one for the submit button.
        this.fieldsUsedCount = this.form.elements.length - 2;

        this.fieldsWithBannedWordSet = new Set();

        this.inputFirstName = this.form.elements["firstName"];
        this.inputLastName = this.form.elements["lastName"];
        this.inputProfileImg = this.form.elements["profileImage"];
        this.inputEmail = this.form.elements["email"];
        this.inputBirthDate = this.form.elements["birthDate"];
        this.inputUsername = this.form.elements["username"];
        this.inputPassword = this.form.elements["password"];
        this.inputPassword2 = this.form.elements["password2"];
        this.submitBtn = this.form.elements["submitBtn"];

        this.submitBtn.setAttribute('disabled', '');

        this.inputFirstName.addEventListener("keyup", this.TextInputValidationCheck);
        this.inputLastName.addEventListener("keyup", this.TextInputValidationCheck);
        this.inputProfileImg.addEventListener("change", this.InputValueValidationCheck);
        this.inputEmail.addEventListener("keyup", this.TextInputValidationCheck);
        this.inputBirthDate.addEventListener("change", this.InputValueValidationCheck);
        this.inputUsername.addEventListener("keyup", this.TextInputValidationCheck);
        this.inputPassword.addEventListener("keyup", this.TextInputValidationCheck);
         // Password gets an additional event check, incase password 2 is changed first, then password is changed to match it.
        this.inputPassword.addEventListener("keyup", this.PasswordConfirmedCheck);
        this.inputPassword2.addEventListener("keyup", this.PasswordConfirmedCheck);
    }

    // Check all typed text
    static TextInputValidationCheck = (event) => {
        const el = event.currentTarget;
        const name = el.getAttribute("name");

        // If nothing in the field at all, highlight as nothing (nothing is indeed invalid, but does not require "invalid" highlighting, so long as it's articulated that all form fields are required)
        if(el.value == "") {
            this.fieldsUsedSet.delete(name);
            this.HighlightNone(el);
        }
        else {
            this.fieldsUsedSet.add(name);

            // Otherwise, check against banned words list
            this.socket.emit("validateText", { textToValidate: el.value }, (isValid) => {
                if(isValid) {
                    this.fieldsWithBannedWordSet.delete(name);
                    this.HighlightValid(el);
                }
                else {
                    this.fieldsWithBannedWordSet.add(name);
                    this.HighlightInvalid(el);
                }

                this.CheckFullFormValid();
            });
        }

        this.CheckFullFormValid();
    }

    // Valid if anything value exists
    static InputValueValidationCheck = (event) => {
        const el = event.currentTarget;
        const name = el.getAttribute("name");

        if(el.value == "") {
            this.fieldsUsedSet.delete(name);
            this.HighlightNone(el);
        }
        else {
            this.fieldsUsedSet.add(name);
            this.HighlightValid(el);
        }

        this.CheckFullFormValid();
    }

    // Valid if password fields match
    static PasswordConfirmedCheck = (event) => {
        this.passwordConfirmed = false;

        if(this.inputPassword2.value == "") {
            this.HighlightNone(this.inputPassword2);
        }
        else {
            if(this.inputPassword2.value == this.inputPassword.value) {
                this.HighlightValid(this.inputPassword2);
                this.passwordConfirmed = true;
            }
            else {
                this.HighlightInvalid(this.inputPassword2);
            }
        }

        this.CheckFullFormValid();
    }

    static CheckFullFormValid() {

        const allfieldsUsed = this.fieldsUsedSet.size == this.fieldsUsedCount;
        const noBannedWords = this.fieldsWithBannedWordSet.size == 0;

        if(allfieldsUsed && noBannedWords && this.passwordConfirmed) {
            this.submitBtn.removeAttribute('disabled');
        }
        else {
            this.submitBtn.setAttribute('disabled', '');
        }
    }

    static HighlightNone(htmlElement) {
        htmlElement.classList.remove('highlightValid');
        htmlElement.classList.remove('highlightInvalid');
        htmlElement.classList.add('highlightNone');
    }
    static HighlightValid(htmlElement) {
        htmlElement.classList.add('highlightValid');
        htmlElement.classList.remove('highlightInvalid');
        htmlElement.classList.remove('highlightNone');
    }
    static HighlightInvalid(htmlElement) {
        htmlElement.classList.remove('highlightValid');
        htmlElement.classList.add('highlightInvalid');
        htmlElement.classList.remove('highlightNone');
    }
}
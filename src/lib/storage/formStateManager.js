import {
  FORM_STATE_KEYS,
  LOCALSTORAGE_TEST,
} from "../../constants/localStorage";

export class FormStateManager {
  static isLocalStorageAvailable() {
    try {
      localStorage.setItem(LOCALSTORAGE_TEST.KEY, LOCALSTORAGE_TEST.VALUE);
      const testValue = localStorage.getItem(LOCALSTORAGE_TEST.KEY);
      localStorage.removeItem(LOCALSTORAGE_TEST.KEY);
      return testValue === LOCALSTORAGE_TEST.VALUE;
    } catch (error) {
      console.error("localStorage is not available:", error);
      return false;
    }
  }

  static saveFormState(formType, formValues) {
    if (!this.isLocalStorageAvailable()) {
      console.error("Cannot save form state: localStorage is not available");
      return false;
    }

    const stateKey = FORM_STATE_KEYS[formType.toUpperCase()];
    if (!stateKey) {
      console.error(`Unknown form type: ${formType}`);
      return false;
    }

    try {
      localStorage.setItem(stateKey, JSON.stringify(formValues));
      return true;
    } catch (error) {
      console.error("Error saving form state:", error);
      return false;
    }
  }

  static restoreFormState(formType) {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    const stateKey = FORM_STATE_KEYS[formType.toUpperCase()];
    if (!stateKey) {
      console.error(`Unknown form type: ${formType}`);
      return null;
    }

    try {
      const savedState = localStorage.getItem(stateKey);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error("Error restoring form state:", error);
      return null;
    }
  }

  static clearFormState(formType) {
    const stateKey = FORM_STATE_KEYS[formType.toUpperCase()];
    if (!stateKey) {
      console.error(`Unknown form type: ${formType}`);
      return false;
    }

    try {
      localStorage.removeItem(stateKey);
      return true;
    } catch (error) {
      console.error("Error clearing form state:", error);
      return false;
    }
  }
}

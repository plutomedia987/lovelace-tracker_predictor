import {
  LitElement,
  html,
  css,
  svg,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

function hasConfigOrEntityChanged(element, changedProps) {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldHass = changedProps.get("hass");
  if (oldHass) {
    return (
      oldHass.states[element._config.entity] !==
      element.hass.states[element._config.entity]
    );
  }

  return true;
}

const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

class TrackerPredictorCard extends LitElement {

  static get properties() {
    return {
      hass: { type: Object},
      _config: { type: Object },
    };
  }

  static getConfigElement() {
    return document.createElement("tracker-prediction-card-editor");
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    return {
      entity: entity,
      low_price: 15,
      mid_price: 23,
     };
  }

  // The user supplied configuration. Throw an exception and Home Assistant
  // will render an error card.
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }

    this._config = config;
    // console.log(config)
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns in masonry view
  getCardSize() {
    return 4;
  }

  // The rules for sizing your card in the grid in sections view
  // getLayoutOptions() {
  //   return {
  //     grid_rows: 3,
  //     grid_columns: 4,
  //     grid_min_rows: 3,
  //     grid_max_rows: 3,
  //   };
  // }

  static get styles() {
    return css`
      .prediction-table{
        width: 100%;
      }

      .prediction-row{
        text-align: center;
      }

      .prediction-date{
        border-bottom: 1px solid var(--secondary-text-color);
      }

      .prediction-price{
        color: var(--primary-text-color);
      }

      .prediction-price-low{
        color: white;
        background-color: mediumseagreen;
        border: 1px solid mediumseagreen;
      }

      .prediction-price-mid{
        color: white;
        background-color: orange;
        border: 1px solid orange;
      }

      .prediction-price-high{
        color: white;
        background-color: crimson;
        border: 1px solid crimson;
      }

      .prediction-round-right{
        border-bottom-right-radius: 15px;
        border-top-right-radius: 15px;
      }
    `;
  }

  _getOrdinal(d) {

    if (d > 3 && d < 21) {
      return "th";
    } else {
      switch (d%10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    }

  }

  _renderCard() {

    let rows = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Sep", "Oct", "Nov", "Dec"];

    this.stateAttr["data"].forEach(row => {

      let date = new Date(Date.parse(row["date"]));

      let level_class = "prediction-price-high";
      if (row["octopus_price"] <= this._config.low_price) {
        level_class = "prediction-price-low";
      } else if (row["octopus_price"] <= this._config.mid_price) {
        level_class = "prediction-price-mid";
      }

      rows.push(html`
        <tr class="prediction-row">
          <td class="prediction-date">
            ${days[date.getDay()]} ${date.getDate()}${this._getOrdinal(date.getDate())} ${months[date.getMonth()]}
          </td>
          <td class="prediction-price ${level_class} prediction-round-right">
            ${row["octopus_price"].toFixed(2)}
          </td>
        </tr>
      `);
    });

    return html`
      <table class="prediction-table">
        <tr>
          <th></th>
          <th>Electric Price (p)</th>
        </tr>
        ${rows}
      </table>
    `;
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    if (Object.keys(this.hass.states).includes(this._config.entity)) {
      this.entityObj = this.hass.states[this._config.entity];
      if (Object.keys(this.entityObj).includes("attributes") && Object.keys(this.entityObj.attributes).includes("data")) {
        this.stateAttr = this.entityObj["attributes"];
        return html`
          <ha-card>
            <h1 class="card-header">Octopus Price Prediction</h1>
            <div class="card-content">
              ${this._renderCard()}
            </div>
          </ha-card>
        `;
      } else {
        return html`
          <ha-card>
            <h1 class="card-header"></h1>
            <div class="card-content">
              Not a prediction entity
            </div>
          </ha-card>
        `;
      }
    } else {
      return html`
        <ha-card>
          <h1 class="card-header"></h1>
          <div class="card-content">
            Select Entity
          </div>
        </ha-card>
      `;
    }

  }
}


class TrackerPredictorCardEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object},
      _config: { type: Object },
    };
  }

  setConfig(config) {
    this._config = config;
  }

  _valueChanged(ev) {
    const config = ev.detail.value;
    fireEvent(this, "config-changed", { config });
  }

  _computeLabelCallback = (schema) => {
    if (this.hass) {
      switch (schema.name) {
        case "title":
          return this.hass.localize(
            `ui.panel.lovelace.editor.card.generic.title`
          );
        case "entity":
          return `${this.hass.localize(
            "ui.panel.lovelace.editor.card.generic.entity"
          )} (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.required"
          )})`;
        case "low_price":
          return "Low Price";
        case "mid_price":
          return "Mid Price";
        default:
          return schema.name;
      }
    } else {
      return "";
    }
  };

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    this.lang = this.hass.selectedLanguage || this.hass.language;

    const schema = [
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: "sensor" } },
      },
      {
        name: "low_price",
        required: true,
        selector: { number: {mode:"box", min: 1, max: 100} },
      },
      {
        name: "mid_price",
        required: true,
        selector: { number: {mode:"box", min: 1, max: 100} },
      }
    ];

    const data = {
      ...this._config,
    };

    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${schema}
      .computeLabel=${this._computeLabelCallback}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }

}

customElements.define("tracker-prediction-card", TrackerPredictorCard);
customElements.define("tracker-prediction-card-editor", TrackerPredictorCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "tracker-prediction-card",
  name: "Octopus Tracker Prediction Card",
  preview: true, // Optional - defaults to false
  description: "Provides the next 13 days of octopus tracker predictions", // Optional
  documentationURL:
    "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card", // Adds a help link in the frontend card editor
});
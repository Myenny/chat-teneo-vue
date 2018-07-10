import Vue from "vue";
import Vuex from "vuex";
import VueJsonp from "vue-jsonp";
import VueLocalStorage from "vue-localstorage";
import Artyom from "artyom.js";
import vuexI18n from "vuex-i18n";
import parseBool from "parseboolean";
import * as LivechatVisitorSDK from "@livechat/livechat-visitor-sdk";
import URL from "url-parse";
import toHex from "colornames";

Vue.use(VueLocalStorage);
Vue.use(VueJsonp, 5000);
Vue.use(Vuex);

const TENEO_CHAT_HISTORY = "teneo-chat-history";
const TENEO_CHAT_DARK_THEME = "darkTheme";

let TENEO_URL = "";
let IFRAME_URL = "";
let LOCALE = "en";
let CHAT_TITLE = "Configure Me";
let RESPONSE_ICON = "";
let USER_ICON = "";
let KNOWLEDGE_DATA = [];
let SEND_CTX_PARAMS = "login";
// const USE_LOCAL_STORAGE = parseBool(activeSolution.useLocalStorage);
let USE_LOCAL_STORAGE = false;
let ENABLE_LIVE_CHAT = false;
let REQUEST_PARAMETERS = "";
let THEME = {
  primary: "#D60270",
  secondary: "#5B017B",
  accent: "#4CAF50",
  error: "#FF5252",
  info: "#2196F3",
  success: "#4CAF50",
  warning: "#FFC107"
}; // default theme

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let chatConfig = JSON.parse(localStorage.getItem("config"));
let activeSolution = null;
if (chatConfig && chatConfig.activeSolution) {
  let deepLink = getParameterByName("dl"); // look for deep link
  if (!deepLink) {
    activeSolution = chatConfig.activeSolution;
    const matchingSolutions = chatConfig.solutions.filter(
      solution => solution.name === activeSolution
    );
    activeSolution = matchingSolutions[0];
  } else {
    // allow for deep linking to a specific solution ?dl=<deepLink>
    const matchingSolutions = chatConfig.solutions.filter(
      solution => solution.deepLink === deepLink
    );
    if (matchingSolutions.length > 0) {
      activeSolution = matchingSolutions[0];
    } else {
      // fall back to default
      activeSolution = chatConfig.activeSolution;
      const matchingSolutions = chatConfig.solutions.filter(
        solution => solution.name === activeSolution
      );
      activeSolution = matchingSolutions[0];
    }
  }

  TENEO_URL = activeSolution.url + "?viewname=STANDARDJSONP";
  IFRAME_URL = activeSolution.iframeUrl;
  LOCALE = activeSolution.locale;
  CHAT_TITLE = activeSolution.chatTitle;
  RESPONSE_ICON = activeSolution.responseIcon;
  USER_ICON = activeSolution.userIcon;
  KNOWLEDGE_DATA = activeSolution.knowledgeData;
  SEND_CTX_PARAMS = activeSolution.sendContextParams
    ? activeSolution.sendContextParams
    : "login";
  // const USE_LOCAL_STORAGE = parseBool(activeSolution.useLocalStorage);
  USE_LOCAL_STORAGE = false;
  let theme = activeSolution.theme;
  for (const key in theme) {
    if (theme[key].charAt(0) !== "#") theme[key] = toHex(theme[key]);
  }
  THEME = theme;
  ENABLE_LIVE_CHAT = parseBool(activeSolution.enableLiveChat);

  document.title = activeSolution.name;

  // find active CTX parameters and build the parameters part of the URL
  activeSolution.contextParams.forEach(function(contextParam) {
    if (contextParam) {
      contextParam.values.forEach(function(value) {
        if (value.active) {
          REQUEST_PARAMETERS =
            REQUEST_PARAMETERS +
            "&" +
            contextParam.name +
            "=" +
            encodeURIComponent(value.text);
        }
      });
    }
  });
}

// update the IFRAME URL
document.getElementById("site-frame").src = IFRAME_URL;

let artyom = null;
if (
  window.hasOwnProperty("webkitSpeechRecognition") &&
  window.hasOwnProperty("speechSynthesis")
) {
  artyom = new Artyom();
  artyom.ArtyomVoicesIdentifiers["en-GB"] = [
    "Google UK English Female",
    "Google UK English Male",
    "en-GB",
    "en_GB"
  ];
  artyom.initialize({
    lang:
      LOCALE === "de"
        ? "de-DE"
        : LOCALE === "nl"
          ? "nl-NL"
          : LOCALE === "es"
            ? "es-US"
            : "en-GB",
    debug: false
  });
}
let timeoutVar;

const translationsEn = {
  "input.box.label": "Say something...",
  "empty.user.input": "Looks like you didn't say anything to me",
  listening: "Listening...",
  "more.button": "more",
  "more.info.title": "More Information",
  "back.to.chat.button": "back to chat",
  "menu.chat": "Chat",
  "menu.about": "About",
  "menu.help": "Help",
  "menu.history": "History",
  "menu.config": "Config",
  "no.chat.history.title": "No Chat History",
  "no.chat.history.body": "Ask me a few questions to get things rolling..",
  "about.page.button": "Learn more",
  "about.page.title": "Teneo by Artificial Solutions",
  "about.page.content":
    "Teneo allows your customers to speak to applications, devices and web services in a natural, human-like and intelligent way",
  "about.page.url": "https://www.artificial-solutions.com/",
  "help.page.title": "Here are some things that you can ask me"
};

const translationsDe = {
  "input.box.label": "Sag etwas...",
  "empty.user.input": "Sieht aus, als hättest du mir nichts gesagt",
  listening: "Zuhören...",
  "more.button": "mehr",
  "more.info.title": "Weitere Informationen",
  "back.to.chat.button": "zurück zum Chat",
  "menu.chat": "Chat",
  "menu.about": "Ungefähr",
  "menu.help": "Hilfe",
  "menu.history": "Geschichte",
  "menu.config": "Config",
  "no.chat.history.title": "Kein Chatverlauf",
  "no.chat.history.body":
    "Stellen Sie mir ein paar Fragen, um die Dinge ins Rollen zu bringen",
  "about.page.button": "Erfahren Sie mehr",
  "about.page.title": "Teneo von Artificial Solutions",
  "about.page.content":
    "Mit Teneo können Ihre Kunden auf natürliche, menschenähnliche und intelligente Weise mit Anwendungen, Geräten und Webdiensten sprechen",
  "about.page.url": "https://www.artificial-solutions.com/de/",
  "help.page.title": "Hier sind einige Dinge, die Sie mich fragen können"
};

const translationsNl = {
  "input.box.label": "Zeg iets...",
  "empty.user.input": "Het lijkt erop dat je niets tegen me zei",
  listening: "het luisteren...",
  "more.button": "meer",
  "more.info.title": "Meer informatie",
  "back.to.chat.button": "terug naar chat",
  "menu.chat": "Babbelen",
  "menu.about": "Over",
  "menu.help": "Help",
  "menu.history": "Geschiedenis",
  "menu.config": "Config",
  "no.chat.history.title": "Geen chatgeschiedenis",
  "no.chat.history.body":
    "Stel me een paar vragen om dingen aan het rollen te krijgen",
  "about.page.button": "Meer informatie",
  "about.page.title": "Teneo van Artificial Solutions",
  "about.page.content":
    "Met Teneo kunnen uw klanten op een natuurlijke, mensachtige en intelligente manier met applicaties, apparaten en webservices spreken",
  "about.page.url": "https://www.artificial-solutions.com/nl/",
  "help.page.title": "Hier zijn enkele dingen die u mij kunt vragen"
};

const translationsEs = {
  "input.box.label": "Di algo...",
  "empty.user.input": "Parece que no me dijiste nada",
  listening: "Escuchando...",
  "more.button": "Más",
  "more.info.title": "Más información",
  "back.to.chat.button": "volver al chat",
  "menu.chat": "Charla",
  "menu.about": "Acerca de",
  "menu.help": "Ayuda",
  "menu.history": "Historia",
  "menu.config": "Config",
  "no.chat.history.title": "Sin historial de chat",
  "no.chat.history.body":
    "Hazme algunas preguntas para que las cosas funcionen",
  "about.page.button": "Aprende más",
  "about.page.title": "Teneo por Artificial Solutions",
  "about.page.content":
    "Teneo les permite a sus clientes hablar con aplicaciones, dispositivos y servicios web de forma natural, humana e inteligente",
  "about.page.url": "https://www.artificial-solutions.com/es/",
  "help.page.title": "Aquí hay algunas cosas que puedes preguntarme"
};

const store = new Vuex.Store({
  state: {
    theme: THEME,
    iframeUrl: IFRAME_URL,
    requestParameters: REQUEST_PARAMETERS,
    chatConfig: chatConfig,
    chatTitle: CHAT_TITLE,
    responseIcon: RESPONSE_ICON,
    userIcon: USER_ICON,
    knowledgeData: KNOWLEDGE_DATA,
    dark: false,
    listening: false,
    speakBackResponses: false,
    userInputReadyForSending: false,
    userInput: "",
    progressBar: false,
    showModal: false,
    teneoUrl: TENEO_URL,
    dialog: [],
    dialogHistory: [],
    modalItem: null,
    isLiveChat: false,
    isWebSite: true,
    enableLiveChat: ENABLE_LIVE_CHAT,
    agentName: null,
    agentID: null,
    agentAvatar: null,
    liveChatMessage: null,
    showLiveChatProcessing: false,
    showChatLoading: false,
    showConfigModal: true
  },
  getters: {
    chatConfig() {
      return store.chatConfig;
    },
    isLiveChat() {
      return store.state.isLiveChat;
    },
    knowledgeData() {
      return store.state.knowledgeData;
    },
    liveChatMessage() {
      return store.state.liveChatMessage;
    },
    showChatLoading() {
      return store.state.showChatLoading;
    },
    showLiveChatProcessing() {
      return store.state.showLiveChatProcessing;
    },
    getChatHistory() {
      if (USE_LOCAL_STORAGE) {
        if (store.state.dialog.length !== 0) {
          let chatHistory = JSON.parse(
            Vue.localStorage.get(TENEO_CHAT_HISTORY, "[]")
          );
          if (chatHistory.length !== 0) {
            store.state.dialog.concat(chatHistory);
          }
        } else {
          store.state.dialog = JSON.parse(
            Vue.localStorage.get(TENEO_CHAT_HISTORY, "[]")
          );
        }
      }
      return store.state.dialog;
    },
    getChatHistorySessionStorage() {
      // TODO: Try and make the chat history in session storage unique to the deeplink
      if (store.state.dialogHistory.length === 0) {
        store.state.dialogHistory = JSON.parse(
          sessionStorage.getItem(TENEO_CHAT_HISTORY)
        );
        if (store.state.dialogHistory === null) {
          store.state.dialogHistory = [];
        }
      }
      return store.state.dialogHistory;
    },
    getUserInput() {
      return store.state.userInput;
    },
    progressBar() {
      return store.state.progressBar;
    },
    getShowModal() {
      return store.state.showModal;
    },
    getShowConfigModal() {
      return store.state.showConfigModal;
    },
    getModalItem() {
      return store.state.modalItem;
    },
    dark() {
      return store.state.dark;
    },
    chatTitle() {
      return store.state.chatTitle;
    }
  },
  mutations: {
    showChatLoading() {
      if (!USE_LOCAL_STORAGE) {
        store.state.showChatLoading = true;
      }
    },
    hideChatLoading() {
      if (!USE_LOCAL_STORAGE) {
        store.state.showChatLoading = false;
      }
    },
    showLiveChatLoading() {
      store.state.showLiveChatProcessing = true;
    },
    hideLiveChatLoading() {
      store.state.showLiveChatProcessing = false;
    },
    clearChatHistory() {
      store.state.dialog = [];
    },
    liveChat(state, transcript) {
      doLiveChatRequest(transcript);
    },
    liveChatStarted() {
      store.state.isLiveChat = true;
    },
    liveChatEnded() {
      store.state.isLiveChat = false;
    },
    changeTheme() {
      store.state.dark = !store.state.dark;
      Vue.localStorage.set(
        TENEO_CHAT_DARK_THEME,
        JSON.stringify(store.state.dark)
      );
    },
    showListening() {
      store.state.listening = true;
    },
    hideListening() {
      store.state.listening = false;
    },
    setUserInput(state, userInput) {
      state.userInput = userInput.replace(/^\w/, c => c.toUpperCase());
    },
    speakBackResponses(state, useTTS) {
      state.speakBackResponses = useTTS;
    },
    sendUserInput(state, response) {
      store.commit("hideProgressBar");
      let hasExtraData = false;
      if (
        response.teneoResponse.extraData.extensions ||
        response.teneoResponse.extraData.liveChat
      ) {
        hasExtraData = true;
      }
      if (response.teneoResponse.extraData.liveChat) {
        store.commit("liveChatStarted");
      }

      let newUserInput = {
        type: "userInput",
        text: response.userInput,
        bodyText: "",
        hasExtraData: false
      };

      state.dialog.push(newUserInput);

      let newReply = {
        type: "reply",
        text: response.teneoAnswer,
        bodyText: "",
        teneoResponse: response.teneoResponse,
        hasExtraData: hasExtraData
      };

      state.dialog.push(newReply);
      if (hasExtraData) {
        state.modalItem = newReply;
        state.showModal = true;
      }

      state.userInput = "";
      if (USE_LOCAL_STORAGE) {
        Vue.localStorage.set(TENEO_CHAT_HISTORY, JSON.stringify(state.dialog));
      }
      state.dialogHistory = JSON.parse(
        sessionStorage.getItem(TENEO_CHAT_HISTORY)
      );
      if (state.dialogHistory === null) {
        state.dialogHistory = state.dialog;
      } else {
        state.dialogHistory.push(newUserInput);
        state.dialogHistory.push(newReply);
      }
      sessionStorage.setItem(
        TENEO_CHAT_HISTORY,
        JSON.stringify(state.dialogHistory)
      );
    },
    showProgressBar() {
      store.state.progressBar = true;
    },
    hideProgressBar() {
      store.state.progressBar = false;
    },
    showConfigModal(state) {
      state.showConfigModal = true;
    },
    hideConfigModal(state) {
      state.showConfigModal = false;
    },
    showModal(state, item) {
      state.modalItem = item;
      state.showModal = true;
    },
    hideModal(state) {
      state.showModal = false;
      state.modalItem = null;
      console.log("modal item should be empty");
    }
  },
  actions: {
    endSession() {
      return new Promise((resolve, reject) => {
        let fullUrl = new URL(store.state.teneoUrl);
        let endSessionUrl =
          fullUrl.protocol +
          "//" +
          fullUrl.host +
          fullUrl.pathname +
          "endsession" +
          (SEND_CTX_PARAMS === "all"
            ? REQUEST_PARAMETERS.length > 0
              ? "?" + REQUEST_PARAMETERS.substring(1, REQUEST_PARAMETERS.length)
              : ""
            : "");

        Vue.jsonp(endSessionUrl, {})
          .then(() => {
            console.log("Session Ended");
            resolve();
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
      });
    },
    login() {
      // get the greeting message if we haven't done so for this session
      return new Promise((resolve, reject) => {
        Vue.jsonp(TENEO_URL + REQUEST_PARAMETERS, {
          command: "login"
          // userInput: ""
        })
          .then(json => {
            store.commit("hideChatLoading"); // about to show the greeting - hide the chat loading spinner
            // console.log(decodeURIComponent(json.responseData.answer))
            const response = {
              type: "reply",
              text: decodeURIComponent(json.responseData.answer).replace(
                /onclick="[^"]+"/g,
                'class="sendInput"'
              ),
              bodyText: "",
              teneoResponse: json.responseData,
              hasExtraData: false
            };
            // sessionStorage.setItem(TENEO_CHAT_HISTORY, JSON.stringify(response))
            store.state.dialog.push(response); // push the getting message onto the dialog
            resolve();
          })
          .catch(err => {
            console.log(err);
            reject(err);
          });
      });
    },
    sendUserInput(context) {
      // send user input to Teneo when a live chat has not begun
      if (!store.getters.isLiveChat) {
        Vue.jsonp(
          store.state.teneoUrl +
            (SEND_CTX_PARAMS === "all" ? REQUEST_PARAMETERS : ""),
          { userinput: store.state.userInput }
        )
          .then(json => {
            // console.log(decodeURIComponent(json.responseData.answer))
            const response = {
              userInput: store.state.userInput,
              teneoAnswer: decodeURIComponent(json.responseData.answer).replace(
                /onclick="[^"]+"/g,
                'class="sendInput"'
              ),
              teneoResponse: json.responseData
            };
            // check if this browser supports the Web Speech API
            if (
              window.hasOwnProperty("webkitSpeechRecognition") &&
              window.hasOwnProperty("speechSynthesis")
            ) {
              if (artyom && store.state.speakBackResponses) {
                artyom.say(response.teneoAnswer);
              }
            }

            context.commit("sendUserInput", response);
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        // send the input to live chat agent and save user input to history
        let newUserInput = {
          type: "userInput",
          text: store.state.userInput,
          bodyText: "",
          hasExtraData: false
        };
        store.state.dialog.push(newUserInput);

        if (USE_LOCAL_STORAGE) {
          Vue.localStorage.set(
            TENEO_CHAT_HISTORY,
            JSON.stringify(store.state.dialog)
          );
        }
        store.state.dialogHistory = JSON.parse(
          sessionStorage.getItem(TENEO_CHAT_HISTORY)
        );
        if (store.state.dialogHistory === null) {
          store.state.dialogHistory = store.state.dialog;
        } else {
          store.state.dialogHistory.push(newUserInput);
        }
        sessionStorage.setItem(
          TENEO_CHAT_HISTORY,
          JSON.stringify(store.state.dialogHistory)
        );
        doLiveChatRequest(store.state.userInput);
        console.log("Sent a message to agent: " + store.state.userInput);
        store.commit("hideProgressBar");
        store.state.userInput = "";
      }
    },
    captureAudio() {
      if (UserDictation != null) {
        if (artyom.isSpeaking()) {
          console.log("Artyom is speaking something. Let's shut it up");
          artyom.shutUp();
        }
        UserDictation.start();
      }
    }
  }
});

Vue.use(vuexI18n.plugin, store);

Vue.i18n.add("en", translationsEn);
Vue.i18n.add("de", translationsDe);
Vue.i18n.add("nl", translationsNl);
Vue.i18n.add("nl", translationsNl);
Vue.i18n.add("es", translationsEs);
Vue.i18n.set(LOCALE);

export { store, TENEO_CHAT_HISTORY, TENEO_URL, USE_LOCAL_STORAGE };

let UserDictation = null;
if (artyom != null) {
  UserDictation = artyom.newDictation({
    continuous: false, // Enable continuous if HTTPS connection
    onResult: function(text) {
      clearTimeout(timeoutVar);
      // Do something with the text
      if (text) {
        store.state.userInput = text.replace(/^\w/, c => c.toUpperCase());
        // console.log('You said: ' + text)
      }
      timeoutVar = setTimeout(function() {
        console.log("timeout - aborting recognition");
        UserDictation.stop();
      }, 500);
    },
    onStart: function() {},
    onEnd: function() {
      store.state.userInputReadyForSending = true;
      store.state.listening = false;
    }
  });
}

// Live Chat
let visitorSDK = null;

if (store.state.enableLiveChat) {
  const liveChatIncLicense = 1234567; // change me https://www.livechatinc.com/
  visitorSDK = LivechatVisitorSDK.init({
    license: liveChatIncLicense
  });

  visitorSDK.on("chat_started", chatData => {
    console.log("chat_started");
    console.log(chatData);

    // when a user reloads the page while a chat is going on, the message history is loaded. We need to stop that from happening by closing the chat
    if (!store.state.isLiveChat) {
      visitorSDK
        .closeChat()
        .then(() => {
          console.log("Live chat has closed");
        })
        .catch(error => {
          console.log(error);
        });
    }
  });

  visitorSDK.on("visitor_queued", queueData => {
    console.log(queueData);
    let message =
      "Chat request sent to agent. You are number " +
      queueData.numberInQueue +
      " in the queue.";
    // only display messages if live chat is active (check for isLiveChat prevents messages from showing when user refreshed the page)
    if (store.state.isLiveChat) {
      let liveChatStatus = {
        type: "liveChatQueue",
        text: message,
        bodyText: "",
        hasExtraData: false
      };
      store.state.dialog.push(liveChatStatus); // push the getting message onto the dialog
    } else {
      visitorSDK
        .closeChat()
        .then(() => {
          console.log("Live chat has closed");
        })
        .catch(error => {
          console.log(error);
        });
    }
  });

  visitorSDK.on("agent_changed", newAgent => {
    console.log(newAgent);
    store.state.agentName = newAgent.name;
    store.state.agentID = newAgent.id;
    store.state.agentAvatar = newAgent.avatarUrl;
    // show typing output agentName + ' is typing...'

    let message = "You are talking to " + newAgent.name + ".";

    // only display messages if live chat is active (check for isLiveChat prevents messages from showing when user refreshed the page)
    if (store.state.isLiveChat) {
      let liveChatStatus = {
        type: "liveChatStatus",
        text: message,
        bodyText: "",
        hasExtraData: false
      };
      store.state.dialog.push(liveChatStatus); // push the getting message onto the dialog
    } else {
      visitorSDK
        .closeChat()
        .then(() => {
          console.log("Chat is closed");
        })
        .catch(error => {
          console.log(error);
        });
    }
  });

  visitorSDK.on("chat_ended", () => {
    console.log("chat ended");
    let message = "Chat with live agent ended.";
    // only display messages if live chat is active (check for isLiveChat prevents messages from showing when user refreshed the page)
    if (store.getters.isLiveChat) {
      let liveChatStatus = {
        type: "liveChatEnded",
        text: message,
        bodyText: "",
        hasExtraData: false
      };
      store.state.dialog.push(liveChatStatus); // push the getting message onto the dialog
    }
    store.commit("liveChatEnded");
  });

  visitorSDK.on("typing_indicator", data => {
    store.state.showLiveChatProcessing = !!data.isTyping;
  });

  visitorSDK.on("new_message", newMessage => {
    console.log(newMessage);
    // only display messages if live chat is active (check for isLiveChat prevents messages from showing when user refreshed the page)
    if (store.state.isLiveChat) {
      if (newMessage.authorId === store.state.agentID) {
        let liveChatResponse = {
          type: "liveChatResponse",
          text: newMessage.text,
          agentAvatar: store.state.agentAvatar,
          agentName: store.state.agentName,
          bodyText: "",
          hasExtraData: false
        };
        store.state.dialog.push(liveChatResponse); // push the getting message onto the dialog
        if (
          window.hasOwnProperty("webkitSpeechRecognition") &&
          window.hasOwnProperty("speechSynthesis")
        ) {
          if (artyom && store.state.speakBackResponses) {
            artyom.say(newMessage.text);
          }
        }

        if (USE_LOCAL_STORAGE) {
          Vue.localStorage.set(
            TENEO_CHAT_HISTORY,
            JSON.stringify(store.state.dialog)
          );
        }
        store.state.dialogHistory = JSON.parse(
          sessionStorage.getItem(TENEO_CHAT_HISTORY)
        );
        if (store.state.dialogHistory === null) {
          store.state.dialogHistory = store.state.dialog;
        } else {
          store.state.dialogHistory.push(liveChatResponse);
        }
        sessionStorage.setItem(
          TENEO_CHAT_HISTORY,
          JSON.stringify(store.state.dialogHistory)
        );
        store.state.userInput = "";
      }
    }
  });
}

/**
 * Send a message to message to the live chat agent
 *
 * @param {*} message
 */
function doLiveChatRequest(message) {
  console.log("Sending message to Live Agent:" + message);
  visitorSDK
    .sendMessage({
      text: message,
      customId: String(Math.random())
    })
    .then(response => {
      console.log(response);
    })
    .catch(error => {
      console.log(error);
    });
}

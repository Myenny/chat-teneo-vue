<template>
  <!-- Reply -->
  <div v-if="item.type === 'reply'" :class="itemIndexInDialog === dialog.length - 1 ? 'pb-3'  : ''">
    <v-row v-if="itemText !== '<span>'" justify="start" no-gutters class="pr-3 pl-1 pt-2">
      <v-col
        cols="2"
        class="text-center d-none d-sm-block"
        v-if="showChatIcons && !$vuetify.breakpoint.smAndDown"
      >
        <v-menu v-if="isLiveAgentAssist" close-on-click close-on-content-click offset-y>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              aria-hidden="true"
              v-long-press="1000"
              @long-press-start="swapInputButton"
              :color="`${responseLookAndFeel.iconColor}`"
              class="teneo-response-icon"
              text
              tile
              icon
              large
            >
              <v-icon large>{{ getResponseIcon }}</v-icon>
            </v-btn>
          </template>

          <v-list class="liveAgentAssitMenu">
            <v-hover
              v-slot:default="{ hover }"
              v-for="menuItem in dynamicAgentAssistMenu"
              :key="menuItem.title"
            >
              <v-list-item @click="menuItem.method" :class="hover ? 'primary' : ''">
                <v-list-item-title :class="hover ? 'white--text' : ''">
                  <v-icon :color="hover ? 'secondary' : ''" class="mr-2">
                    {{
                    menuItem.icon
                    }}
                  </v-icon>
                  {{ menuItem.title }}
                </v-list-item-title>
              </v-list-item>
            </v-hover>
          </v-list>
        </v-menu>
        <v-icon
          v-else
          large
          :color="`${responseLookAndFeel.iconColor}`"
          class="teneo-response-icon"
        >{{ getResponseIcon }}</v-icon>
      </v-col>
      <v-col
        class="text-left"
        :class="!showChatIcons || $vuetify.breakpoint.smAndDown ? 'ml-2' : ''"
      >
        <v-card
          :color="$vuetify.theme.dark ? '#333333' : `${responseLookAndFeel.blockBgColor}`"
          class="chat-card chat-card-left text-left"
          :ripple="false"
        >
          <span
            class="teneo-reply"
            :class="`${leopardFont} ${responseLookAndFeel.blockTextColor === 'light' ? 'white--text' : ''}`"
          >
            <span v-html="addAccessibilityPrefix(itemText)"></span>
          </span>
        </v-card>
      </v-col>
    </v-row>

    <Card
      v-if="hasCard(item) && itemIndexInDialog === dialog.length - 1"
      :item="item"
      :ripple="false"
      class="mb-2"
    />
    <!-- Show Inline Components -->
    <span v-for="(extension, index) in itemExtensions(item)" :key="index + 'inlines' + uuid">
      <v-row v-if="hasInlineType(extension, 'youTube')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <YouTube :videoId="youTubeVideoId(extension)" class="mt-2"></YouTube>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'audio')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <Audio :url="audioInfo(extension).audioUrl" class="mt-2"></Audio>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'vimeo')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <Vimeo :videoId="vimeoId(extension)" class="mt-2"></Vimeo>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'video')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <Video
            :url="videoInfo(extension).videoUrl"
            :type="videoInfo(extension).videoType"
            class="mt-2"
          ></Video>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'map')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <Map :address="mapInfo(extension).address" class="mt-2"></Map>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'image')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <ImageAnimation :url="imageUrl(extension)" class="mt-2"></ImageAnimation>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'carousel')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <Carousel :imageItems="carouselImageArray(extension)" class="mt-2"></Carousel>
        </v-col>
      </v-row>
      <v-row v-if="hasInlineType(extension, 'table')" no-gutters class="px-3 pt-2">
        <v-col cols="12">
          <v-simple-table
            class="elevation-2"
            :dense="extension.dense"
            :fixed-header="extension.fixedHeader"
            :height="extension.maxHeight ? extension.maxHeight : undefined"
          >
            <template v-slot:default>
              <thead>
                <tr>
                  <th
                    class="text-left"
                    v-for="header in extension.headers"
                    :key="header + uuid"
                  >{{header}}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in extension.rows" :key="index + uuid">
                  <td v-for="(column, colIndex) in row" :key="colIndex + uuid">{{ column }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-col>
      </v-row>
    </span>
    <!-- Additional Response Chunks -->
    <div v-if="responseHasChunks">
      <v-row
        v-for="(chunkText, responseChunkIndex) in getChunks"
        :key="responseChunkIndex + uuid"
        no-gutters
        class="pr-3 pl-1 pt-1"
      >
        <v-col cols="2" class="text-center" v-if="showChatIcons">
          <!-- <v-btn
            v-long-press="1000"
            tabindex="-1"
            @long-press-start="swapInputButton"
            style="opacity: 0"
            :color="`${responseLookAndFeel.iconColor} white--text`"
            class="teneo-response-icon"
            text
            tile
            icon
            large
          >
            <v-icon large class="white--text">{{ getResponseIcon }}</v-icon>
          </v-btn>-->
        </v-col>
        <v-col>
          <v-card
            class="chat-card chat-card-left text-left"
            :ripple="false"
            :class="!showChatIcons || $vuetify.breakpoint.smAndDown ? 'ml-2' : ''"
            :color="$vuetify.theme.dark ? '#333333' : '#FFFFFF'"
          >
            <span
              class="teneo-reply"
              :class="`${leopardFont} ${responseLookAndFeel.blockTextColor === 'light' ? 'white--text' : ''}`"
            >
              <span v-html="addAccessibilityPrefix(chunkText)"></span>
            </span>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <DelayedResponse v-if="showDelayedResponse && itemIndexInDialog === dialog.length - 1"></DelayedResponse>
    <!-- show any options in the response: for example Yes, No Maybe -->
    <v-col cols="12" v-if="routerCheckList && itemIndexInDialog === dialog.length - 1" class="px-3">
      <v-card>
        <div class="d-flex flex-no-wrap justify-space-between">
          <div>
            <h2 class="headline">
              {{
              routerCheckList.title
              }}
            </h2>

            <v-row
              align="center"
              justify="start"
              v-for="(item, index) in routerCheckList.items"
              :key="index"
              class="ml-1"
            >
              <v-col cols="2">
                <v-icon :color="item.color">{{ item.icon }}</v-icon>
              </v-col>
              <v-col cols="10">
                <p>{{ item.label }}</p>
              </v-col>
            </v-row>
          </div>

          <v-avatar class="ma-3" size="100" tile>
            <v-img src="https://wi.presales.artificial-solutions.com/media/mytelco/router.png"></v-img>
          </v-avatar>
        </div>
      </v-card>
    </v-col>

    <v-card
      v-if="
        hasCollection &&
          (itemIndexInDialog === dialog.length - 1 || hasPermanentOptions)
      "
      class="mb-1 mx-3 pt-0 px-1 pb-2 elevation-0 text-center transparent teneo-response-collection"
    >
      <!-- Button Options -->
      <v-card-text class="teneo-button-options pt-2 pb-2" v-if="!hasLongOptions">
        <h2 v-text="getOptions.title" class="subtitle-1 font-weight-bold"></h2>
        <div v-if="getOptions.html" class="elevation-2 mt-2" v-html="getOptions.items"></div>
        <span v-else v-for="(option, optionIndex) in getOptions.items" :key="optionIndex + uuid">
          <v-btn
            height="25"
            class="option-btn mr-2 mt-2"
            x-small
            :color="`success ${textColor('success')}`"
            :aria-label="option.aria ? option.aria : option.name"
            @click="optionClicked(option)"
          >
            <v-icon
              v-if="option.icon"
              left
              style="padding-top: 2px; opacity: 0.7 !important;"
            >{{`mdi-${option.icon}`}}</v-icon>
            {{ option.name }}
          </v-btn>
        </span>
      </v-card-text>
      <!-- Line based List Options -->

      <v-list v-else class="mt-2 elevation-2">
        <v-list-item-group color="primary">
          <template v-for="(option, altOptionIndex) in getOptions.items">
            <v-list-item
              tag="a"
              :key="altOptionIndex + 'tile' + uuid"
              @click="optionClicked(option)"
              :aria-label="option.aria ? option.aria : option.name"
              class="text-left pl-2 pr-2"
              style="height: 40px;"
              dense
            >
              <v-list-item-icon class="mr-4">
                <v-icon>{{ getLongListIcon(altOptionIndex) }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content class="text-left">
                <!-- <v-list-item-title v-html="option.name"></v-list-item-title> -->
                <v-list-item-subtitle v-html="option.name" style="white-space: unset;"></v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list-item-group>
      </v-list>
    </v-card>
    <!-- more info for modals & calendar picker button -->
    <v-row
      no-gutters
      v-if="hasFeedbackForm(item) && itemIndexInDialog === dialog.length - 1"
      class="mr-3"
    >
      <v-col cols="12" class="text-right mb-2">
        <v-btn
          :color="`success ${textColor('success')}`"
          aria-label="Leave Feedback"
          class="modal-btn mt-2"
          small
          @click="displayFeedbackForm"
        >
          <v-icon left class="teneo-icon" style="opacity: 0.7 !important;">mdi-thumbs-up-down</v-icon>
          {{
          getFeedbackFormConfig.label && getFeedbackFormConfig.label !== null
          ? getFeedbackFormConfig.label
          : "Leave Feedback"
          }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row no-gutters v-if="!completedForm && hasForm()" class="mr-4">
      <v-col cols="12" class="text-right mb-2">
        <Form
          v-if="mustShowForm()"
          :formConfig="getFormConfig()"
          @showForm="showForm()"
          @hideForm="hideForm()"
          @completed="completed()"
          @handleFocus="handleFocus()"
        />

        <v-btn
          :color="`success ${textColor('success')}`"
          aria-label="Form needs filling opens in a new window"
          class="modal-btn mt-2"
          small
          @click="showForm()"
        >
          <v-icon
            left
            class="teneo-icon"
            style="opacity: 0.7 !important;"
          >mdi-file-document-edit-outline</v-icon>
          {{
          getFormConfig && getFormConfig.openFormButtonText
          ? getFormConfig.openFormButtonText
          : "Form"
          }}
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      no-gutters
      v-if="(item.hasExtraData && hasModal(item) && notLiveChatTranscript) ||
            itemHasLongResponse(item)"
      class="mt-0 mr-3"
    >
      <v-col cols="12" class="text-right mb-1">
        <v-btn
          :aria-label="modalButtonText.aria"
          :color="`success ${textColor('success')}`"
          class="modal-btn mt-2"
          small
          @click="showModal"
        >
          <v-icon left class="teneo-icon" style="opacity: 0.7 !important;">{{ modalButtonIcon }}</v-icon>
          {{ modalButtonText.text }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      v-if="mustShowDate && itemIndexInDialog === dialog.length - 1"
      class="mt-2 mr-3"
    >
      <!-- Date Picker -->
      <v-col class="text-right" cols="12">
        <v-btn
          small
          aria-label="Open Date Picker"
          fab
          class="teneo-userinput-icon elevation-2 mb-2"
          :color="`success ${textColor('success')}`"
          @click="toggleDate()"
        >
          <v-icon class="teneo-icon" style="opacity: 0.7 !important;">mdi-calendar-clock</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row
      no-gutters
      v-if="mustShowTime && itemIndexInDialog === dialog.length - 1"
      class="mt-2 mr-3"
    >
      <!-- Time Picker -->
      <v-col class="text-right" cols="12">
        <v-btn
          small
          fab
          aria-label="Open Time Picker"
          class="teneo-userinput-icon elevation-2 mb-2"
          :color="`success ${textColor('success')}`"
          @click="toggleTime()"
        >
          <v-icon large class="teneo-icon" style="opacity: 0.7 !important;">mdi-clock</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-snackbar
      v-if="snackbar"
      v-model="snackbar"
      absolute
      color="primary"
      :timeout="snackBarTimeout"
      top
    >{{ snackBarText }}</v-snackbar>
    <AgentAssistCannedResponseForm
      v-if="agentAssist.cannedResponseForm"
      :text="agentAssist.cannedResponseText"
      @hideDialog="agentAssist.cannedResponseForm = false"
      @saved="handleAgentAssistCannedResponseSave"
    />
  </div>
</template>

<script>
const logger = require("@/utils/logging").getLogger("ChatTeneoResponse.vue");
import LongPress from "vue-directive-long-press";
// import Audio from "./Audio";
// import Carousel from "./Carousel";
// import ImageAnimation from "./ImageAnimation";
// import DelayedResponse from "./DelayedResponse";
// import Video from "./Video";
// import AgentAssistCannedResponseForm from "./AgentAssistCannedResponseForm";
// import Map from "./Map";
// import Vimeo from "./Vimeo";
// import Card from "./Card";
// import YouTube from "./YouTube";
import { mapGetters } from "vuex";
import copy from "copy-to-clipboard";
const isHtml = require("is-html");
var stripHtml = require("striptags");

export default {
  name: "ChatTeneoResponse",
  directives: {
    "long-press": LongPress
  },
  components: {
    Audio: () => import("./Audio"),
    AgentAssistCannedResponseForm: () =>
      import("./AgentAssistCannedResponseForm"),
    Carousel: () => import("./Carousel"),
    Card: () => import("./Card"),
    ImageAnimation: () => import("./ImageAnimation"),
    DelayedResponse: () => import("./DelayedResponse"),
    Map: () => import("./Map"),
    Video: () => import("./Video"),
    Vimeo: () => import("./Vimeo"),
    YouTube: () => import("./YouTube"),
    Form: () => import("./Form")
  },
  props: ["item", "itemIndexInDialog"],
  data() {
    return {
      simpleTable: {
        name: "displaySimpleTable",
        dense: false,
        maxHeight: null,
        fixedHeader: false,
        headers: ["Account", "Balance"],
        rows: [
          ["Current", "$1271.21"],
          ["Private", "$137.54"]
        ]
      },
      snackbar: false,
      snackBarTimeout: 1500,
      snackBarText: "Success",
      agentAssist: {
        cannedResponseForm: false,
        cannedResponseText: "",
        menu: [
          {
            icon: "mdi-backburger",
            title: "Send to live chat",
            method: this.sendToLiveChatAgentInputBox
          },
          {
            icon: "mdi-clipboard-arrow-up-outline",
            title: "Copy to clipboard",
            method: this.copyToClipboard
          },
          {
            icon: "mdi-pound-box-outline",
            title: "Add as canned response",
            method: this.showLiveAgentCannedResponseForm
          },
          {
            icon: "mdi-refresh",
            title: "Reset bot session",
            method: this.resetBotSession
          },
          {
            icon: "mdi-link-box-variant-outline",
            title: "Send URL to customer",
            condition: this.hasLink,
            method: this.sendLinkToLiveAgent
          },
          {
            icon: "mdi-tooltip-image-outline",
            title: "Get media data",
            condition: this.hasMedia,
            method: this.sendResponseMediaToLiveAgent
          },
          {
            icon: "mdi-arrow-expand-up",
            title: "Create moment",
            condition: false,
            method: this.createLiveChatMoment
          }
        ]
      },
      displayForm: false,
      hasFormAutomaticallyDisplayed: false,
      completedForm: false
    };
  },
  computed: {
    ...mapGetters([
      "leopardFont",
      "responseLookAndFeel",
      "isLiveAgentAssist",
      "dark",
      "textColor",
      "itemAnswerTextCropped",
      "showChatIcons",
      "itemExtensions",
      "getFeedbackFormConfig",
      "imageUrl",
      "carouselImageArray",
      "responseIcon",
      "uuid",
      "hasInline",
      "hasMediaExtensions",
      "hasInlineType",
      "showFeedbackForm",
      "dialogs",
      "getLatestDialogHistory",
      "hasModal",
      "hasFeedbackForm",
      "lastItemHasLongResponse",
      "itemHasLongResponse",
      "showDelayedResponse",
      "vimeoId",
      "audioInfo",
      "videoInfo",
      "mapInfo",
      "youTubeVideoId"
    ]),
    routerCheckList() {
      let extensions = this.itemExtensions(this.item);
      let routerCheckList = null;

      extensions.forEach(extension => {
        if (extension.name.startsWith("displayRouterCheckList")) {
          routerCheckList = extension.parameters;
        }
      });

      return routerCheckList;
    },
    getResponseIcon() {
      let icon = this.responseIcon;
      if (
        "teneoResponse" in this.item &&
        this.item.teneoResponse.emotion !== "" &&
        decodeURIComponent(this.item.teneoResponse.emotion).indexOf("|") !== -1
      ) {
        let rawEmotion = decodeURIComponent(this.item.teneoResponse.emotion);
        icon = "mdi-" + rawEmotion.split("|")[1].trim();
      }
      return icon;
    },
    dynamicAgentAssistMenu() {
      let filtered = this.agentAssist.menu.filter(menuItem => {
        if ("condition" in menuItem) {
          if (typeof menuItem.condition === "boolean") {
            return menuItem.condition;
          } else if (typeof menuItem.condition === "function") {
            return menuItem.condition();
          }
        } else {
          return true;
        }
      });

      return filtered;
    },
    modalButtonText() {
      let response = {
        text: this.$t("button.more"),
        aria: this.$t("button.more")
      };

      if (this.itemHasLongResponse(this.item)) {
        response.aria = "Read full response will open in a new window.";
        return response;
      }
      let extensions = this.itemExtensions(this.item);
      let countOfNonInlines = 0;
      let buttonLabel = this.$t("button.more");
      let aria = this.$t("button.more");

      if (this.item.teneoResponse.link.href !== "") {
        aria = `Website ${aria}`;
        buttonLabel = this.$t("button.page");
      }

      let externalExtensions = extensions.filter(
        extension =>
          this.item.teneoResponse.link.href === "" &&
          (!extension.name.startsWith("displayCollection") ||
            ("inline" in extension && !extension.inline))
      );

      externalExtensions.forEach(extension => {
        let ariaButtonLabel = extension.title
          ? extension.title
          : extension.aria
          ? extension.aria
          : "";
        aria = ariaButtonLabel
          ? `about "${ariaButtonLabel}" will open in a new window`
          : `available will open in a new window`;

        countOfNonInlines++;
        if (extension.name.startsWith("displayVideo")) {
          buttonLabel = this.$t("button.video");
          aria = `Video ${aria}`;
        } else if (extension.name.startsWith("displayPanel")) {
          buttonLabel = this.$t("button.more");
          aria = `More information ${aria}`;
        } else if (extension.name.startsWith("displayImageCarousel")) {
          buttonLabel = this.$t("button.image");
          aria = `Image carousel ${aria}`;
        } else if (extension.name.startsWith("displayImage")) {
          buttonLabel = this.$t("button.image");
          aria = `Image ${aria}`;
        } else if (extension.name.startsWith("displayModal")) {
          buttonLabel = this.$t("button.more");
          aria = `More information ${aria}`;
        } else if (extension.name.startsWith("displayMap")) {
          buttonLabel = this.$t("button.map");
          aria = `Map ${aria}`;
        } else if (
          extension.name.startsWith("displayTable") ||
          extension.name.startsWith("displayTransactionsTable")
        ) {
          aria = `Table ${aria}`;
          buttonLabel = this.$t("button.table");
        }
      });
      if (countOfNonInlines > 1) {
        aria = "More information will open in a new window";
        buttonLabel = this.$t("button.more"); // fallback to "more" when there could be multiple
      }
      response.aria = !aria.startsWith("available")
        ? aria
        : "More information will open in a new window";
      response.text = buttonLabel ? buttonLabel : this.$t("button.more");
      return response;
    },
    modalButtonIcon() {
      let extensions = this.itemExtensions(this.item);
      let countOfNonInlines = 0;
      let iconName = "mdi-arrow-top-left-thick";
      extensions.forEach(extension => {
        if (!extension.inline || this.item.teneoResponse.link.href !== "") {
          countOfNonInlines++;
        }

        if (extension.name.startsWith("displayVideo")) {
          iconName = "mdi-youtube";
        } else if (extension.name.startsWith("displayImageCarousel")) {
          iconName = "mdi-view-carousel";
        } else if (extension.name.startsWith("displayImage")) {
          iconName = "mdi-file-image";
        } else if (
          extension.name.startsWith("displayTable") ||
          extension.name.startsWith("displayTransactionsTable")
        ) {
          iconName = "mdi-table-large";
        } else if (extension.name.startsWith("displayMap")) {
          iconName = "mdi-google-maps";
        } else if (extension.name.startsWith("displayAudio")) {
          iconName = "mdi-music-box";
        }

        if (this.item.teneoResponse.link.href !== "") {
          iconName = "mdi-link-variant";
        }
      });

      if (countOfNonInlines > 1) {
        return "mdi-arrow-top-left-thick";
      }

      return iconName;
    },
    itemText() {
      let itemText = this.item.text;
      if (itemText.includes("||")) {
        let firstAnswer = itemText.split("||")[0].trim();
        itemText = firstAnswer;
      } else {
        itemText = this.itemAnswerTextCropped(this.item);
      }
      return itemText;
    },
    hasCollection() {
      let extensions = this.itemExtensions(this.item);
      let hasOptions = false;

      extensions.forEach(extension => {
        if (extension.name.startsWith("displayCollection")) {
          hasOptions = true;
        }
      });

      return hasOptions;
    },
    responseHasChunks() {
      return this.item.type === "reply" && this.item.text.includes("||");
    },
    getChunks() {
      let chunks = this.item.text.split("||");
      chunks.shift(); // get everything but the first one
      return chunks;
    },
    dialog() {
      if (this.$route.name === "chat") {
        return this.dialogs ? this.dialogs : [];
      } else {
        // history in session storage
        return this.getLatestDialogHistory ? this.getLatestDialogHistory : [];
      }
    },
    hasPermanentOptions() {
      let extensions = this.itemExtensions(this.item);
      let hasPermanentOptions = false;
      extensions.forEach(extension => {
        if (extension.name.startsWith("displayCollection")) {
          if (extension.permanent !== "undefined") {
            hasPermanentOptions = extension.permanent;
          }
        }
      });
      return hasPermanentOptions;
    },
    hasLongOptions() {
      let extensions = this.itemExtensions(this.item);
      let hasLongOptions = false;
      extensions.forEach(extension => {
        if (extension.name.startsWith("displayCollection")) {
          if (extension.hasLongOptions !== "undefined") {
            hasLongOptions = extension.hasLongOptions;
          }
        }
      });
      return hasLongOptions;
    },
    getOptions() {
      let extensions = this.itemExtensions(this.item);
      // only get the first set of options.
      let options = {};
      extensions.forEach(extension => {
        if (extension.name === "displayCollection") {
          options = extension.parameters.content;
        }
      });
      return options;
    },
    mustShowDate() {
      if (
        decodeURIComponent(this.item.teneoResponse.extraData.datePicker) !==
        "undefined"
      ) {
        return true;
      }
      return false;
    },
    notLiveChatTranscript() {
      let transcript = decodeURIComponent(
        this.item.teneoResponse.extraData.liveChat
      );
      return transcript === "undefined";
    },
    mustShowTime() {
      if (
        decodeURIComponent(this.item.teneoResponse.extraData.timePicker) !==
        "undefined"
      ) {
        return true;
      }
      return false;
    }
  },
  methods: {
    addAccessibilityPrefix(text) {
      const prefix508 = `<span class="sr-only">Chat bot said.</span>`;
      if (!isHtml(text)) {
        text = `<p>${prefix508}${text}</p>`;
      } else {
        if (text.startsWith("<p>")) {
          text = `<p>${prefix508}${text.substring(3)}`;
        } else {
          text = `<p>${prefix508}${text}</p>`; //TODO: Don't like this as we could have nested paragraphs
        }
      }
      return text;
    },
    hasMedia() {
      return this.hasMediaExtensions(this.item);
    },
    sendResponseMediaToLiveAgent() {
      logger.debug(`Sending media to Agent`);
      let finalMessageToAgent = "";
      const extensions = this.itemExtensions(this.item);
      extensions.forEach(extension => {
        if (this.hasInlineType(extension, "youTube")) {
          finalMessageToAgent += `\nYouTube: https://www.youtube.com/watch?v=${this.youTubeVideoId(
            extension
          )}`;
        } else if (this.hasInlineType(extension, "vimeo")) {
          finalMessageToAgent += `\nVimeoId: ${this.vimeoId(extension)}`;
        } else if (this.hasInlineType(extension, "video")) {
          finalMessageToAgent += `\nVideo: ${
            this.videoInfo(extension).videoUrl
          }`;
        } else if (this.hasInlineType(extension, "map")) {
          finalMessageToAgent += `\nAddress: ${
            this.mapInfo(extension).address
          }`;
        } else if (this.hasInlineType(extension, "image")) {
          logger.debug(this.imageUrl(extension));
          finalMessageToAgent += `\nImage: ${this.imageUrl(extension)}`;
        } else if (this.hasInlineType(extension, "carousel")) {
          finalMessageToAgent += `\nImages: ${this.carouselImageArray(
            extension
          )}`;
        }
      });
      if (finalMessageToAgent) {
        this.$store.dispatch(
          "putLiveChatAgentMessage",
          decodeURIComponent(finalMessageToAgent)
        );
      }
    },
    createLiveChatMoment() {
      logger.debug(`Create Moment`);
    },
    handleAgentAssistCannedResponseSave() {
      this.agentAssist.cannedResponseForm = false;
      this.snackBarText = "#️⃣ New canned response added";
      this.snackbar = true;
    },
    showLiveAgentCannedResponseForm() {
      this.agentAssist.cannedResponseText = stripHtml(this.itemText);
      this.agentAssist.cannedResponseForm = true;
    },
    hasLink() {
      return this.item.teneoResponse.link.href;
    },
    sendLinkToLiveAgent() {
      this.$store.dispatch(
        "putLiveChatAgentMessage",
        decodeURIComponent(this.item.teneoResponse.link.href)
      );
    },
    resetBotSession() {
      this.$store.dispatch("endSessionLite").then(() => {
        this.snackBarText = "♻ Bot session reset";
        this.snackbar = true;
      });
    },
    copyToClipboard() {
      copy(stripHtml(this.itemText));
      this.snackBarText = "📋 Copied to your clipboard";
      this.snackbar = true;
    },
    sendToLiveChatAgentInputBox() {
      this.$store.dispatch("putLiveChatAgentMessage", this.itemText);
    },
    isLastInDialog() {
      return this.itemIndexInDialog === this.dialog.length - 1;
    },
    handleFocus() {
      this.$emit("handleFocus");
    },
    mustShowForm() {
      if (this.displayForm) {
        return true;
      } else {
        let formConfig = this.getFormConfig();

        if (
          this.isLastInDialog() &&
          !this.hasFormAutomaticallyDisplayed &&
          formConfig &&
          formConfig.openAutomatically
        ) {
          this.hasFormAutomaticallyDisplayed = true;
          this.displayForm = true;
          return true;
        }
      }
      return false;
    },
    completed() {
      this.hideForm();
      this.completedForm = true;
      this.$store.commit("REMOVE_FORM_CONFIG", this.item.id);
    },
    showForm() {
      this.displayForm = true;
    },
    hideForm() {
      this.displayForm = false;
    },
    hasForm() {
      if (
        this.item.teneoResponse &&
        this.item.teneoResponse.extraData &&
        this.item.teneoResponse.extraData.formConfig
      ) {
        return true;
      }
      return false;
    },
    getFormConfig() {
      if (
        this.item.teneoResponse &&
        this.item.teneoResponse.extraData &&
        this.item.teneoResponse.extraData.formConfig
      ) {
        return JSON.parse(
          decodeURIComponent(this.item.teneoResponse.extraData.formConfig)
        );
      }
      return null;
    },
    hasCard(item) {
      if (
        item.teneoResponse.extraData &&
        item.teneoResponse.extraData.displayCard
      ) {
        return true;
      } else {
        return false;
      }
    },
    getLongListIcon(altOptionIndex) {
      let iconName = "mdi-numeric-9-plus-box-outline";
      if (altOptionIndex + 1 <= 9) {
        iconName = "mdi-numeric-" + (altOptionIndex + 1) + "-box-outline";
      }
      return iconName;
    },
    showModal() {
      this.$store.commit("HIDE_CHAT_MODAL"); // hide all modals first
      this.$store.commit("HIDE_508_CONTENT");
      this.$store.commit("SHOW_CHAT_MODAL", this.item);
    },
    displayFeedbackForm() {
      this.$emit("showFeedback");
    },
    toggleDate() {
      this.$emit("toggleDate");
    },
    toggleTime() {
      this.$emit("toggleTime");
    },
    swapInputButton() {
      this.$emit("swapInputButton");
    },
    optionClicked(option) {
      this.$store.commit("SHOW_PROGRESS_BAR");
      this.$store.commit(
        "SET_USER_INPUT",
        option.text ? option.text : option.name
      );
      let optionClickParam = "&isClick=true";
      this.$store
        .dispatch(
          "sendUserInput",
          option.params
            ? "&" + option.params + optionClickParam
            : optionClickParam
        )
        .then(() => {
          this.$emit("handleFocus");
        });
    }
  }
};
</script>

<style scoped>
.teneo-button-options {
  padding: 0;
}

.option-btn {
  font-size: 13px;
  text-transform: unset;
  white-space: normal;
}

.modal-btn {
  font-size: 13px;
  white-space: normal;
}

.options-list {
  height: 50px !important;
}

.options-list-subtile {
  color: unset !important;
}
</style>

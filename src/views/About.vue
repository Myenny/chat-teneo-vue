<template>
  <v-card class="teneo-about-card leopard-alternative-views" flat>
    <span aria-hidden="true">
      <youTube :videoId="youTubeVideoId"></youTube>
    </span>
    <v-card-title primary-title>
      <h2 class="headline mb-3">{{ $t("about.page.title") }}</h2>
    </v-card-title>
    <v-card-text>
      <p>{{ $t("about.page.content") }}</p>
    </v-card-text>
    <v-row justify="center" class="pb-3">
      <v-card-actions>
        <v-btn
          :loading="loading"
          color="secondary"
          aria-label="Learn More about Artificial Solutions opens in a new window"
          :href="$t('about.page.url')"
          target="_blank"
        >{{ $t("about.page.button") }}</v-btn>
        <v-btn
          color="secondary"
          aria-label="Back to Chat Bot"
          ripple
          to="/"
        >{{ $t('back.to.chat.button') }}</v-btn>
      </v-card-actions>
    </v-row>
  </v-card>
</template>

<script>
const logger = require("@/utils/logging").getLogger("About.vue");
// import YouTube from "../components/YouTube";
export default {
  components: {
    YouTube: () => import("../components/YouTube")
  },
  data() {
    return {
      youTubeVideoId: "a4LZFqz-lSg",
      loading: false
    };
  },
  beforeRouteLeave(from, to, next) {
    this.$emit("closeMenu");
    next();
  },
  computed: {},
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        let element = document.getElementById("leopard-chat-toolbar-title");
        if (element) {
          element.focus();
        }
      }, 100);

      setTimeout(() => {
        let iframes = document.getElementsByTagName("iframe");
        iframes.forEach(iframe => {
          if (iframe.hasAttribute("allow")) {
            let allowValue = iframe.getAttribute("allow");
            if (allowValue.indexOf("accelerometer") !== -1) {
              iframe.setAttribute("tabindex", "-1");
            }
          }
        });
      }, 1000);
    });
  }
};
</script>

<style>
.teneo-about-card {
  width: 360px;
}

@media only screen and (max-width: 480px) {
  .teneo-about-card {
    width: 100vw !important;
  }
}
</style>

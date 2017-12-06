<template>
  <div class="treemap-constructor">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h1 class="title"> Treemap constructor </h1>
        </div>
      </div>
    </section>
    <div class="datapackage">
      <div class="datapackage-loader container">
        <b-field label="Datapackage">
          <b-input class="datapackageHash" v-model="datapackage">
          </b-input>
          <a class="button constructor-ui" @click="getModel()">Datensatz laden</a>
        </b-field>
      </div>
      <div class="config" v-if="hasModel">
        <b-tabs v-model="activeTab" type="is-boxed">
          <b-tab-item label="Hierarchies" class="hierarchies config-group tile is-vertical is-parent">
            <p class="explanation">Wählen Sie hier nur die Klassifizierungen der Haushaltstitel (also: Administrative Functional und Economic Classification). Hier werden die verschiedenen Levels der Haushaltstitel visualisiert.</p>
            <div class="tile is-child buttons">
              <div class="button-ui" v-for="hierarchy in this.model.hierarchies">
                <a class="button constructor" :class="{'is-info': hasHierarchy(hierarchy)}" @click="selectHierarchy(hierarchy)">{{hierarchy['label']}}</a>
              </div>
            </div>
            <div class="columns tile is-child">
              <div class="column" v-for="(hierarchy, hierarchyName) in config.hierarchies">
                <div class="card">
                  <div clas="card-header">
                    <p class="card-header-title">
                      {{hierarchy.label}}
                    </p>
                  </div>
                  <div class="card-content">
                    <b-field label="Bezeichnung">
                      <b-input v-model="hierarchy.label" @change.native="updateURL(hierarchy)"></b-input>
                    </b-field>
                  </div>
                </div>
            </div>
            </div>

          </b-tab-item>
          <b-tab-item label="Measures" class="measures config-group tile is-vertical is-parent">
            <p class="explanation">Wählen Sie hier das Zahlenformat, Währungssymbol und Nachkommastelle aus. Sie können auch eine Skala hinzufügen, welche z.B. die Beträge pro Person (oder pro Erwerbstätigen) anzeigt. Fügen Sie dazu die Zahl der Einwohner des Ortes hinzu – als ganze Zahl ohne Punkt oder Komma.</p>
            <div class="content tile is-child">
              <div class="tile buttons">
                <div class="button-ui" v-for="aggregate in this.model.aggregates">
                  <a class="button" @click="selectMeasure(aggregate)" :class="{'is-info': hasMeasure(aggregate)}" v-if="aggregate['function'] == 'sum'">{{aggregate['label']}}</a>
                </div>
              </div>
              <div class="columns tile is-child">
                <div class="column" v-for="value in this.config.value">
                  <div class="card">
                    <div clas="card-header">
                      <p class="card-header-title">
                        {{value.field}}
                      </p>
                    </div>
                    <div class="card-content">
                  <div><b-field label="Bezeichnung"><b-input v-model="value.label"></b-input></b-field></div>
                  <div class="number-format">
                    <b-input class="symbol" v-model="value.formatOptions.symbol"></b-input>
                    <span class="num">1</span>
                    <b-input class="sep" v-model="value.formatOptions.thousand"></b-input>
                    <span class="num">000</span>
                    <b-input class="sep" v-model="value.formatOptions.decimal"></b-input>
                    <span class="num">00</span><b-input v-model="value.formatOptions.postfix"></b-input>
                  </div>
                  <div><b-field label="Nachkommastellen"><b-input v-model="value.formatOptions.precision"></b-input></b-field></div>
                    </div>
                </div>
                </div>
              </div>
              <div class="tile is-child">
                <button class="button" @click="addScale()">Skala hinzufügen</button>
              <div class="columns tile is-child">
                <div class="column" v-if="i > 0" v-for="(scale, i) in config.scale">
                  <div class="card">
                    <div class="card-content">
                      <b-field label="Bezeichnung">
                        <b-input v-model="scale.label"></b-input>
                      </b-field>
                      <b-field label="Abkürzung">
                        <b-input v-model="scale.description"></b-input>
                      </b-field>
                      <b-field label="absolute Zahl">
                        <b-input v-model="scale.number"></b-input>
                      </b-field>
                      <button class="button" @click="removeScale(scale)">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </b-tab-item>
          <b-tab-item label="Filters" class="filters config-group tile is-vertical is-parent">
            <p class="explanation">Legen Sie fest nach welchen Kategorien die Daten gefiltert werden, z.B. das Jahr, die Budget Richtung oder die Betragsart. Außerdem können Sie die Erstansicht definieren, also welches Jahr als erstes angezeigt werden soll.</p>
            <div class="content tile is-child">
              <div class="buttons">
                <div class="button-ui" v-for="dimension in this.model.dimensions">
                  <a class="button" @click="selectFilter(dimension)" :class="{'is-info': hasFilter(dimension)}">{{dimension['label']}}</a>
                </div>
              </div>
              <div class="columns">
                <div class="column" v-for="(filter, filterName) in config.filters">
                <div class="card">
                  <div clas="card-header">
                    <p class="card-header-title">
                    {{filter.label}}
                    </p>
                  </div>
                  <div class="card-content">
                    <div class="content">
                      <b-field label="Bezeichnung">
                        <b-input v-model="filter.label"></b-input>
                      </b-field>
                      <b-field label="Standardauswahl">
                        <b-select class="btn btn-default dropdown-toggle" v-model="filter.defaultValue">
                          <option :value="filterValue.value" :key="filterValue.value" v-for="filterValue in filter.values">{{filterValue.label}}</option>
                        </b-select>
                      </b-field>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </b-tab-item>
        </b-tabs>
        <div class="content export">
          <button class="button is-medium is-success" @click="downloadConfig">Konfiguration herunterladen</button>
        </div>
      </div>
    </div>
    <div class="treemap-preview" v-if="showTreemap">
      <treemap @v-on:update="updateData()" :datapackage="datapackage" apiurl="https://openspending.org/api/3/cubes/" :config="config"></treemap>
    </div>
  </div>
</template>

<script>
import { treemap } from 'dpvis'
import { snakeCase } from 'lodash'
import * as axios from 'axios'
import 'dpvis/dist/lib/dpvis.min.css'

export default {
  name: 'treemap-constructor',
  components: { treemap },
  data () {
    return {
      apiurl: 'https://openspending.org/api/3/cubes/',
      datapackage: 'a6a16b964a7e784f99adecc47f26318a:berlin_16_17_clean',
      hasModel: false,
      showTreemap: false,
      config: {'datapackage': this.datapackage, 'hierarchies': [], 'value': [], 'scale': [], 'filters': {}},
      model: {},
      update: false,
      formatOptionsDefault: { 'symbol': '$', 'decimal': '.', 'thousand': ',', 'precision': 2, format: '%s%v', postfix: '' },
      activeTab: 0
    }
  },
  methods: {
    emptyConfig: function () {
      return Object.keys(this.config).length === 0
    },

    addScale: function () {
      if (this.config.scale.length === 0) {
        this.config.scale.push({'label': 'Total', 'number': 1, 'description': ''})
      }
      var newScale = {'label': '', 'number': 1, 'description': ''}
      this.config.scale.push(newScale)
    },

    removeScale: function (scale) {
      var index = this.config.scale.indexOf(scale)
      this.config.scale.splice(index, 1)
    },

    updateURL: function (hierarchy) {
      hierarchy.url = snakeCase(hierarchy.label)
    },

    selectHierarchy: function (hierarchy) {
      var hasHierarchy = this.config['hierarchies'].findIndex(h => h['label'] === hierarchy['label'])
      if (hasHierarchy === -1) {
        this.config['hierarchies'].push({
          'datapackageHierarchy': hierarchy['ref'],
          'url': hierarchy['ref'],
          'label': hierarchy['label']
        })
      } else {
        if (this.config['hierarchies'].length === 1) {
          this.showTreemap = false
        }
        this.config['hierarchies'].splice(hasHierarchy, 1)
      }

      this.showTreemap = true
    },

    hasHierarchy: function (hierarchy) {
      var hasHierarchy = this.config['hierarchies'].findIndex(h => h['label'] === hierarchy['label'])
      return (hasHierarchy > -1)
    },

    hasMeasure: function (measure) {
      var hasMeasure = this.config['value'].findIndex(h => h['label'] === measure['label'])
      return (hasMeasure > -1)
    },

    hasFilter: function (filter) {
      var hasFilter = this.config['filters'].hasOwnProperty(filter['label'])
      return hasFilter
    },

    showConfig: function () {
      this.$dialog.alert({'datapackage': this.datapackage,
        message: '<pre>' + this.configString + '</pre>'
      })
    },

    downloadConfig: function () {
      var element = document.createElement('a')
      element.setAttribute('href', 'data:text/plaincharset=utf-8,' + encodeURIComponent(this.configString))
      element.setAttribute('download', 'config.json')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },

    selectMeasure: function (measure) {
      var hasMeasure = this.config['value'].findIndex(h => h['label'] === measure['label'])
      if (hasMeasure === -1) {
        this.config['value'].push({
          'field': measure['ref'],
          'formatOptions': this.formatOptionsDefault,
          'label': measure['label']
        })
      } else {
        if (this.config['value'].length > 1) {
          this.config['value'].splice(hasMeasure, 1)
        }
      }
    },

    selectFilter: function (dimension) {
      if (this.config.filters.hasOwnProperty(dimension['label'])) {
        this.$delete(this.config.filters, dimension['label'])
        return
      }
      var newFilter = {}
      newFilter['name'] = dimension['key_ref']
      newFilter['label_ref'] = dimension['label_ref']
      newFilter['ref'] = dimension['ref']
      newFilter['type'] = dimension.attributes[dimension['key_attribute']].datatype
      newFilter['default'] = true
      newFilter['defaultValue'] = ''
      newFilter['defaultLabel'] = 'All'
      newFilter['label'] = dimension.attributes[dimension['label_attribute']].label
      newFilter['values'] = [{'value': '', 'label': 'All'}]

      var apiRequestUrl = `${this.apiurl}${this.datapackage}/members/${newFilter['ref']}/`
      axios.get(apiRequestUrl).then(response => {
        var responseData = response.data.data
        for (var i in responseData) {
          var newOption = {
            'value': responseData[i][newFilter['name']],
            'label': responseData[i][newFilter['label_ref']]
          }
          newFilter['values'].push(newOption)
        }

        this.$set(this.config.filters, dimension['label'], newFilter)
      }).catch(e => {
        console.log(e)
      })
    },

    getModel: function () {
      if (this.datapackage) {
        var apiRequestUrl = `${this.apiurl}${this.datapackage}/model/`
        axios.get(apiRequestUrl).then(response => {
          this.model = response.data.model
          this.hasModel = true

          // Find aggregate of type 'sum'
          var sumAggregate = {}
          var aggregateKeys = Object.keys(this.model.aggregates)
          for (var i in aggregateKeys) {
            var key = aggregateKeys[i]
            if (this.model.aggregates[key]['function'] === 'sum') {
              sumAggregate = this.model.aggregates[key]
              break
            }
          }

          if (sumAggregate) {
            this.$set(this.config, 'value', [])
            this.$set(this.config, 'datapackage', this.datapackage)
            this.config['value'].push({ 'field': sumAggregate['ref'], 'formatOptions': this.formatOptionsDefault, 'label': sumAggregate['label'] })
          }
        })
      }
    }
  },
  computed: {
    configString: function () {
      return JSON.stringify(this.config, null, 2)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.datapackage {
  background-color: #f6f6f6;
  padding: 20px;

  .datapackage-loader.container {
    .field.has-addons {
      justify-content: center;
      padding-bottom: 30px;

      label {
         padding: 5px;
      }

      .datapackageHash {

        input {
          min-width: 600px;
        }

      }
    }
  }

  .config {
    .b-tabs {
      margin: auto;
    }

   }

}

.config-group {
  min-height: 100px;
}

.content {
  width: 100%;
}

.panel:not(:last-child) {
  margin-bottom: 0;
}

.columns {
  margin-top: 10px;
}
.column {
  h1 {
    font-weight: bold;
  }

  max-width: 500px;
}

.dialog .modal-card {
  max-width: none;
}

#treemap {
   width: 1200px;

}

.number-format {
  .control {
    float: left;
    input {
      border: 0;
      background-color: rgba(0,0,0,0.1);
    }
  }
  .symbol {
    width: 8ch;
  }
  .sep {
     width: 3ch;
  }
  .num {
     float: left;
     font-size: 18px;
  }

  &::after {
    clear: both;
    content: '';
    display: block;
  }
}

.export {
   padding-top: 20px;
}

.filters-buttons {
   min-height: 100px;
}

.button-ui {
  margin-right: 5px;
  margin-top: 5px;
  float: left;
}

.buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.explanation {
  max-width: 80ch;
  margin-bottom: 1em;
}

</style>

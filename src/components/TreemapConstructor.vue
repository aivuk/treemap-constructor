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
          <a class="button" @click="getModel()">Load datapackage</a>
        </b-field>
      </div>
      <div class="config" v-if="hasModel">
        <b-tabs v-model="activeTab">
          <b-tab-item label="Hierarchies" class="hierarchies config-group">
            <a class="button" v-for="hierarchy in this.model.hierarchies"  :class="{'is-primary': hasHierarchy(hierarchy)}" @click="selectHierarchy(hierarchy)">{{hierarchy['label']}}</a>
          </b-tab-item>
          <b-tab-item label="Measures" class="measures config-group">
            <div class="content">
              <a class="button" @click="selectMeasure(aggregate)" :class="{'is-primary': aggregate['ref'] === config['value'][0]['field']}" v-for="aggregate in this.model.aggregates" v-if="aggregate['function'] == 'sum'">{{aggregate['label']}}</a>
              <div class="columns">
                <div class="column" v-for="value in this.config.value">
                  <h1>{{value.field}}</h1>
                  <div><b-field label="Label:"><b-input v-model="value.label"></b-input></b-field></div>
                  <div class="number-format">
                    <b-input class="symbol" v-model="value.formatOptions.symbol"></b-input>
                    <span class="num">1</span>
                    <b-input class="sep" v-model="value.formatOptions.thousand"></b-input>
                    <span class="num">000</span>
                    <b-input class="sep" v-model="value.formatOptions.decimal"></b-input>
                    <span class="num">00</span>
                  </div>
                  <div><b-field label="Precision:"><b-input v-model="value.formatOptions.precision"></b-input></b-field></div>
                  <div><b-field label="Format:"><b-input v-model="value.formatOptions.format"></b-input></b-field></div>
                </div>
              </div>
            </div>
          </b-tab-item>
          <b-tab-item label="Filters" class="filters config-group">
            <div class="content">
              <div class="filters-buttons">
              <a class="button" @click="selectFilter(dimension)" :class="{'is-primary': hasFilter(dimension)}" v-for="dimension in this.model.dimensions">{{dimension['label']}}</a>
              </div>
              <div class="columns">
                <div class="column" v-for="filter in this.config.filters">
                  <h1>{{filter.label}}</h1>
                  <div>Label: <b-input v-model="filter.label"></b-input></div>
                  <div>Has default: <b-switch v-model="filter.default"></b-switch></div>
                  <div v-if="filter.default">
                    <b-select class="btn btn-default dropdown-toggle"  v-model="filter.defaultValue">
                      <option :value="filterValue.value" v-bind:key="filterValue.label" v-for="filterValue in filter.values">{{filterValue.label}}</option>
                    </b-select>
                  </div>
                </div>
              </div>
            </div>
          </b-tab-item>
        </b-tabs>
      <div class="content export">
        <button class="button is-medium is-primary" @click="showConfig">Show config</button>
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
      config: {'hierarchies': [], 'value': [], 'filters': {}},
      model: {},
      update: false,
      formatOptionsDefault: { 'symbol': '$', 'decimal': '.', 'thousand': ',', 'precision': 2, format: '%s %v' },
      activeTab: 0
    }
  },
  methods: {
    emptyConfig: function () {
      return Object.keys(this.config).length === 0
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

    hasFilter: function (filter) {
      var hasFilter = this.config['filters'].hasOwnProperty(filter['label'])
      return hasFilter
    },

    showConfig: function () {
      this.$dialog.alert({
        message: '<pre>' + JSON.stringify(this.config, null, 2) + '</pre>'
      })
    },

    selectMeasure: function (measure) {
      this.config['value'].push({ 'field': measure['ref'], 'formatOptions': this.formatOptionsDefault, 'label': measure['label'] })
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
      newFilter['default'] = false
      newFilter['defaultLabel'] = 'All'
      newFilter['label'] = dimension.attributes[dimension['label_attribute']].label
      newFilter['values'] = []

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
            this.config['value'].push({ 'field': sumAggregate['ref'], 'formatOptions': this.formatOptionsDefault, 'label': sumAggregate['label'] })
          }
        })
      }
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
      max-width: 60%;
      margin: auto;
    }
   }

}

.content {
  width: 100%;
}

.panel:not(:last-child) {
  margin-bottom: 0;
}

.columns {
  margin-top: 10px;
  justify-content: center;
}
.column {
  h1 {
    font-weight: bold;
  }

  max-width: 25%;
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
     font-size: 25px;
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
</style>

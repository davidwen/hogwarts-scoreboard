var Houses = new Meteor.Collection('houses');

var ADMIN = 'admin';
var HOUSES = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff']

if (Meteor.isClient) {

  Meteor.startup(function() {
    // Page to control points
    var path = window.location.pathname;
    if (path.indexOf('admin') != -1 ||
        path.indexOf('demo') != -1) {
      Session.set(ADMIN, true);
    }
  });

  String.prototype.capitalize = function() {
     return this.toLowerCase().replace(/^.|\s\S/g, function(a) { return a.toUpperCase(); });
  };

  Deps.autorun(function() {
    var maxScore = 0;
    var houses = Houses.find().fetch();
    if (!houses.length || Session.get(ADMIN)) {
      return;
    }

    var len = houses.length;
    var updatedHouse;
    var updatedScore;
    for (var ii = 0; ii < len; ii++) {
      var house = houses[ii];
      if (house.score > maxScore) {
        maxScore = house.score;
      }
      var previousScore = Session.get(house.name);
      if (previousScore && house.score != previousScore) {
        updatedHouse = house.name;
        updatedScore = house.score - previousScore;
      }
      Session.set(house.name, house.score);
    }

    if (updatedHouse) {
      var updateText = updatedScore + ' Points to ' + updatedHouse.capitalize();
      var snd = new Audio('http://dwen.me/ttsgateway.php?tl=en&q=' + updateText);
      snd.play();
      var $alert = $('<div/>')
        .addClass('points-alert')
        .addClass(updatedHouse + '-alert')
        .text(updateText);
      $('#scores').append($alert);
      $alert.animate({
        opacity: 1,
        top: '10%'
      }, {
        duration: 5000,
        easing: 'easeOutQuint'
      }).animate({
        opacity: 0,
        top: '-30%'
      }, {
        complete: function() {
          $alert.remove();
        },
        duration: 2000,
        easing: 'easeInQuint',
        queue: true
      });
    }

    for (var ii = 0; ii < len; ii++) {
      var house = houses[ii];
      // Set bar's top between 3% and 98%
      $('#' + house.name + '-bar').css({top: 98 - (95.0 * house.score / maxScore) + '%'});
      $('#' + house.name + '-score').text(house.score);
    }
  });

  Template.main.admin = function() {
    return Session.get(ADMIN);
  }

  Template.admin.events = {
    'click .house-btn': function() {
      var $btn = $(event.target);
      var $score = $('#score-input');
      var houseName = $btn.attr('id').split('-')[0];
      var score = Number($score.val());
      $score.val('');
      if (score) {
        var house = Houses.findOne( {name: houseName} );
        Houses.update(house._id, {$inc: {score: score}});
      }
    }
  }
}

if (Meteor.isServer) {
  // Initialize houses if not found
  Meteor.startup(function () {
    for (var ii = 0, len = HOUSES.length; ii < len; ii++) {
      var house = Houses.findOne( {name: HOUSES[ii]} );
      if (!house) {
        Houses.insert( {name: HOUSES[ii], score: 0} );
      }
    }
  });
}

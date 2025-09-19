const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    planType: {
      type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'),
      allowNull: false,
      defaultValue: 'free'
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired', 'past_due'),
      allowNull: false,
      defaultValue: 'active'
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'paypal', 'bank_transfer'),
      allowNull: true
    },
    limits: {
      type: DataTypes.JSONB,
      defaultValue: {
        dailySearches: 10,
        monthlySearches: 300,
        features: []
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true
  });

  // Plan limits configuration
  Subscription.PLAN_LIMITS = {
    free: {
      dailySearches: 10,
      monthlySearches: 300,
      aiModels: ['gemini'],
      features: ['basic_analysis'],
      teamMembers: 1,
      apiCalls: 100,
      support: 'community'
    },
    starter: {
      dailySearches: 100,
      monthlySearches: 3000,
      aiModels: ['gemini', 'claude'],
      features: ['basic_analysis', 'related_keywords', 'blog_analysis'],
      teamMembers: 1,
      apiCalls: 1000,
      support: 'email'
    },
    pro: {
      dailySearches: 500,
      monthlySearches: 15000,
      aiModels: ['gemini', 'claude', 'chatgpt'],
      features: ['basic_analysis', 'related_keywords', 'blog_analysis', 'ai_blog_writing', 'bulk_analysis', 'export'],
      teamMembers: 5,
      apiCalls: 5000,
      support: 'priority'
    },
    enterprise: {
      dailySearches: Infinity,
      monthlySearches: Infinity,
      aiModels: ['gemini', 'claude', 'chatgpt'],
      features: ['all'],
      teamMembers: Infinity,
      apiCalls: Infinity,
      support: '24/7'
    }
  };

  // Plan pricing (in cents for Stripe)
  Subscription.PLAN_PRICING = {
    free: 0,
    starter: 1900, // $19
    pro: 4900, // $49
    enterprise: null // Custom pricing
  };

  Subscription.prototype.getPlanLimits = function() {
    return Subscription.PLAN_LIMITS[this.planType];
  };

  Subscription.prototype.isFeatureEnabled = function(feature) {
    const limits = this.getPlanLimits();
    return limits.features.includes('all') || limits.features.includes(feature);
  };

  return Subscription;
};
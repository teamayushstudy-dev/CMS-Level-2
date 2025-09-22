import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import VendorOrder from '@/models/VendorOrder';
import Sale from '@/models/Sale';
import PaymentRecord from '@/models/PaymentRecord';
import Target from '@/models/Target';
import User from '@/models/User';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('leads')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const userIds = searchParams.get('userIds')?.split(',') || [];

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate + 'T00:00:00.000Z'),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      }
    };

    let baseFilter: Record<string, any> = { ...dateFilter };
    const dataFilter = permissions.getDataFilter();
    
    if (Object.keys(dataFilter).length > 0) {
      baseFilter = { $and: [dateFilter, dataFilter] };
    }

    if (userIds.length > 0) {
      const userFilter = { assignedAgent: { $in: userIds } };
      baseFilter = baseFilter.$and 
        ? { $and: [...baseFilter.$and, userFilter] }
        : { $and: [baseFilter, userFilter] };
    }

    // Get all leads for the period
    const leads = await Lead.find(baseFilter)
      .populate('assignedAgent', 'name email')
      .lean();

    // Status Distribution
    const statusDistribution = leads.reduce((acc: any, lead) => {
      const status = lead.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistributionArray = Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value: value as number,
      color: getStatusColor(name)
    }));

    // Monthly Trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthLeads = await Lead.countDocuments({
        ...baseFilter,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthSales = await Lead.countDocuments({
        ...baseFilter,
        status: { $in: ['Sale Payment Done', 'Product Purchased'] },
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthRevenue = await Lead.aggregate([
        {
          $match: {
            ...baseFilter,
            status: { $in: ['Sale Payment Done', 'Product Purchased'] },
            createdAt: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$salesPrice' }
          }
        }
      ]);

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        leads: monthLeads,
        sales: monthSales,
        revenue: monthRevenue[0]?.total || 0
      });
    }

    // Agent Performance (All Status)
    const agentPerformance = await Lead.aggregate([
      {
        $match: {
          ...baseFilter,
          status: {
            $in: [
              'New',
              'Connected',
              'Nurturing',
              'Waiting for respond',
              'Customer Waiting for respond',
              'Follow up',
              'Desision Follow up',
              'Payment Follow up',
              'Payment Under Process',
              'Customer making payment',
              'Wrong Number',
              'Taking Information Only',
              'Not Intrested',
              'Out Of Scope',
              'Trust Issues',
              'Voice mail',
              'Incomplete Information',
              'Sourcing',
              'Sale Payment Done',
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedAgent',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: '$assignedAgent',
          agentName: { $first: '$agent.name' },
          totalLeads: { $sum: 1 },
          followups: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Follow up', 'Desision Follow up', 'Payment Follow up']] },
                1,
                0
              ]
            }
          },
          salePaymentDone: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Sale Payment Done'] }, 1, 0]
            }
          },
          engines: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'engine'] }
                }
              }
            }
          },
          transmissions: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'transmission'] }
                }
              }
            }
          },
          parts: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'part'] }
                }
              }
            }
          },
          totalPitchedProductPrice: {
            $sum: {
              $reduce: {
                input: '$products',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.pitchedProductPrice', 0] }] }
              }
            }
          },
          totalProductPrice: {
            $sum: {
              $reduce: {
                input: '$products',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.productAmount', 0] }] }
              }
            }
          },
          tentativeMargin: {
            $sum: {
              $cond: {
                if: {
                  $or: [
                    {
                      $eq: [
                        {
                          $reduce: {
                            input: '$products',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.pitchedProductPrice', 0] }] }
                          }
                        }, 0
                      ]
                    },
                    {
                      $eq: [
                        {
                          $reduce: {
                            input: '$products',
                            initialValue: 0,
                            in: { $add: ['$$value', { $ifNull: ['$$this.productAmount', 0] }] }
                          }
                        }, 0
                      ]
                    }
                  ]
                },
                then: 0,
                else: {
                  $subtract: [
                    {
                      $reduce: {
                        input: '$products',
                        initialValue: 0,
                        in: { $add: ['$$value', { $ifNull: ['$$this.pitchedProductPrice', 0] }] }
                      }
                    },
                    {
                      $reduce: {
                        input: '$products',
                        initialValue: 0,
                        in: { $add: ['$$value', { $ifNull: ['$$this.productAmount', 0] }] }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Agent Performance (Product Purchased Only)
    const agentPerformanceProductPurchased = await Lead.aggregate([
      { 
        $match: { 
          ...baseFilter,
          status: 'Product Purchased'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedAgent',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $group: {
          _id: '$assignedAgent',
          agentName: { $first: '$agent.name' },
          totalLeads: { $sum: 1 },
          converted: { $sum: 1 },
          engines: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'engine'] }
                }
              }
            }
          },
          transmissions: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'transmission'] }
                }
              }
            }
          },
          parts: {
            $sum: {
              $size: {
                $filter: {
                  input: '$products',
                  cond: { $eq: ['$$this.productType', 'part'] }
                }
              }
            }
          },
          totalSalesPrice: { $sum: { $ifNull: ['$salesPrice', 0] } },
          totalCostPrice: { $sum: { $ifNull: ['$costPrice', 0] } },
          totalMarginTentative: { $sum: { $ifNull: ['$totalMargin', 0] } }
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Team Performance
    const teamStats = await Lead.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Product Purchased'] }, 1, 0]
            }
          },
          followups: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Follow up', 'Desision Follow up', 'Payment Follow up']] },
                1,
                0
              ]
            }
          },
          salesPaymentDone: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Sale Payment Done'] }, 1, 0]
            }
          },
          totalSalesPrice: { $sum: { $ifNull: ['$salesPrice', 0] } },
          totalCostPrice: { $sum: { $ifNull: ['$costPrice', 0] } },
          totalMarginTentative: { $sum: { $ifNull: ['$totalMargin', 0] } }
        }
      }
    ]);

    const teamPerformance = teamStats[0] || {
      totalLeads: 0,
      converted: 0,
      followups: 0,
      salesPaymentDone: 0,
      totalSalesPrice: 0,
      totalCostPrice: 0,
      totalMarginTentative: 0
    };

    // Payment Methods Distribution
    const paymentMethods = await Lead.aggregate([
      { 
        $match: { 
          ...baseFilter,
          modeOfPayment: { $exists: true, $ne: [null, ''] }
        }
      },
      {
        $group: {
          _id: '$modeOfPayment',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$salesPrice', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const paymentMethodsFormatted = paymentMethods.map(pm => ({
      method: pm._id,
      count: pm.count,
      totalAmount: pm.totalAmount
    }));

    // Product Types Distribution
    const productTypes = await Lead.aggregate([
      { $match: baseFilter },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productType',
          count: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$salesPrice', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const productTypesFormatted = productTypes.map(pt => ({
      type: pt._id,
      count: pt.count,
      revenue: pt.revenue
    }));

    // State Distribution
    const stateDistribution = await Lead.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$billingInfo.state', null] },
              '$billingInfo.state',
              '$shippingInfo.state'
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const stateDistributionFormatted = stateDistribution.map(sd => ({
      state: sd._id,
      count: sd.count
    }));

    // Summary Statistics
    const totalLeads = leads.length;
    const totalRevenue = leads.reduce((sum, lead) => sum + (lead.salesPrice || 0), 0);
    const averageLeadValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;
    const convertedLeads = leads.filter(lead => 
      ['Sale Payment Done', 'Product Purchased'].includes(lead.status)
    ).length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalMargin = leads.reduce((sum, lead) => sum + (lead.totalMargin || 0), 0);

    // Get current month target data for tentative report
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyTarget = await Target.findOne({
      isActive: true,
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart }
    });

    // Calculate tentative report data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayLeads = await Lead.find({
      ...baseFilter,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const monthToDateLeads = await Lead.find({
      ...baseFilter,
      createdAt: { $gte: monthStart, $lte: currentDate }
    }).lean();

    const followupLeads = monthToDateLeads.filter(lead => 
      ['Follow up', 'Desision Follow up', 'Payment Follow up'].includes(lead.status)
    );

    const tentativeReport = {
      monthlyTarget: monthlyTarget?.targetAmount || 0,
      dailyTarget: monthlyTarget ? Math.round(monthlyTarget.targetAmount / monthEnd.getDate()) : 0,
      targetAsOfToday: monthlyTarget ? Math.round((monthlyTarget.targetAmount / monthEnd.getDate()) * currentDate.getDate()) : 0,
      marginAchievedTillDate: monthToDateLeads.reduce((sum, lead) => sum + (lead.totalMargin || 0), 0),
      todayCalls: todayLeads.length,
      todayEngines: todayLeads.reduce((sum, lead) => 
        sum + (lead.products?.filter((p: any) => p.productType === 'engine').length || 0), 0
      ),
      todayParts: todayLeads.reduce((sum, lead) => 
        sum + (lead.products?.filter((p: any) => p.productType === 'part').length || 0), 0
      ),
      todayAchieved: todayLeads.reduce((sum, lead) => sum + (lead.totalMargin || 0), 0),
      tentativeFollowups: followupLeads.length,
      tentativeSales: followupLeads.reduce((sum, lead) => sum + (lead.salesPrice || 0), 0),
      tentativeMargin: followupLeads.reduce((sum, lead) => sum + (lead.tentativeMargin || 0), 0)
    };

    const response = {
      statusDistribution: statusDistributionArray,
      monthlyTrends,
      agentPerformance,
      agentPerformanceProductPurchased,
      teamPerformance,
      paymentMethods: paymentMethodsFormatted,
      productTypes: productTypesFormatted,
      stateDistribution: stateDistributionFormatted,
      tentativeReport,
      summary: {
        totalLeads,
        totalRevenue,
        averageLeadValue,
        conversionRate,
        totalMargin
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'New': '#3B82F6',
    'Connected': '#10B981',
    'Nurturing': '#F59E0B',
    'Waiting for respond': '#F97316',
    'Customer Waiting for respond': '#8B5CF6',
    'Follow up': '#06B6D4',
    'Desision Follow up': '#F43F5E',
    'Payment Follow up': '#D946EF',
    'Payment Under Process': '#6366F1',
    'Customer making payment': '#EC4899',
    'Wrong Number': '#EF4444',
    'Taking Information Only': '#84CC16',
    'Not Intrested': '#6B7280',
    'Out Of Scope': '#64748B',
    'Trust Issues': '#71717A',
    'Voice mail': '#8B5CF6',
    'Incomplete Information': '#DC2626',
    'Sale Payment Done': '#059669',
    'Product Purchased': '#525252',
    'Sourcing': '#0891B2'
  };
  return colors[status] || '#6B7280';
}
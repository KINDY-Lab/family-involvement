// ═══════════════════════════════════════════════════════════════
// data.js — All questionnaire data
// Content from 家长问卷.md, structure from questionnaire_prd.md
// ═══════════════════════════════════════════════════════════════

const QUESTIONNAIRE_DATA = {

  // ── Module A: Demographics ──
  demographics: [
    {
      id: 'demo_role',
      text: '您的身份是孩子的：',
      type: 'radio',
      options: ['母亲', '父亲', '其他__________'],
      hasOther: true,
      required: true
    },
    {
      id: 'demo_child_gender',
      text: '填写本问卷对应孩子的性别是：',
      type: 'radio',
      options: ['男', '女'],
      required: true
    },
    {
      id: 'demo_num_children',
      text: '您目前一共有几个孩子？',
      type: 'radio',
      options: ['1个', '2个', '3个', '4个及以上'],
      required: true
    },
    {
      id: 'demo_child_order',
      text: '您填写本问卷对应的孩子，在家庭中排行第几？',
      type: 'radio',
      options: ['老大', '老二', '老三', '老四及以后'],
      required: true
    },
    {
      id: 'demo_caregiver',
      text: '孩子目前的最主要照顾者是（可多选）：',
      type: 'checkbox',
      options: ['母亲', '父亲', '爷爷奶奶', '外公外婆', '保姆', '其他__________'],
      hasOther: true,
      required: true
    },
    {
      id: 'demo_education',
      text: '您的最高学历是：',
      type: 'radio',
      options: ['初中及以下', '高中或中专', '大专', '本科', '硕士及以上'],
      required: true
    },
    {
      id: 'demo_birthdate',
      text: '您的出生年月是（例：1990.03）',
      type: 'text',
      placeholder: '例如：1990.03',
      required: true
    },
    {
      id: 'demo_job',
      text: '您目前的工作类别最符合以下哪一项？',
      type: 'radio',
      options: [
        '国家机关、党群组织、企业、事业单位负责人/管理人员',
        '专业技术人员（如教师、医生、工程师、律师等）',
        '办事人员和有关人员（如行政、文秘等）',
        '商业、服务业人员（如销售、餐饮、客服等）',
        '生产、运输设备操作人员及农林牧渔生产人员',
        '自由职业者/个体经营者',
        '全职父母',
        '其他__________'
      ],
      hasOther: true,
      required: true
    },
    {
      id: 'demo_overtime',
      text: '您的工作加班频率大致为：',
      type: 'radio',
      options: [
        '几乎从不加班（能准时上下班）',
        '偶尔加班（每月有几天需要加班）',
        '经常加班（每周都有几天需要加班）',
        '频繁加班（几乎每天都在加班或工作时间极长）',
        '工作时间极不固定（如倒班制、需要随时待命）',
        '不适用（如全职父母）'
      ],
      required: true
    },
    {
      id: 'demo_social_ladder',
      text: '想象一个有10级阶梯的梯子，代表我们社会中人们的地位。梯子的最高层（10）代表社会中地位最高、最有钱、受教育程度最高、工作最体面的人；梯子的最底层（1）代表社会中地位最低、最没钱、受教育程度最低、工作最不体面的人。您认为您的家庭目前处于哪一阶梯？',
      type: 'slider',
      min: 1,
      max: 10,
      minLabel: '社会地位最低',
      maxLabel: '社会地位最高',
      required: true
    }
  ],

  // ── Module B1: Family Involvement Questionnaire (FIQ) ──
  // 35 items, 1-4 Likert scale (很少 → 总是)
  // Organized into 3 sub-sections
  fiq: {
    sections: [
      {
        id: 'home',
        title: '居家学习',
        color: '#F59E0B',
        questions: [
          { id: 'fiq_01', text: '我花时间陪孩子一起练习数学/数字技能。' },
          { id: 'fiq_02', text: '我花时间和孩子一起练习读写技能（如给孩子讲故事，一起写写画画）。' },
          { id: 'fiq_03', text: '我花时间和孩子一起参与创造性的活动（如：唱歌，跳舞，画画等）。' },
          { id: 'fiq_04', text: '我跟我孩子谈论我多么地喜欢学习新事物。' },
          { id: 'fiq_05', text: '我为孩子带回家学习的资料（如：视频，书籍等)。' },
          { id: 'fiq_06', text: '我在家给孩子提供一个专门读书和放置学习物品的空间。' },
          { id: 'fiq_07', text: '我在孩子就读的班级上做志愿者。' },
          { id: 'fiq_08', text: '我给孩子讲一些我小时候读书的事情。' },
        ]
      },
      {
        id: 'school',
        title: '学校参与',
        color: '#3B82F6',
        questions: [
          { id: 'fiq_09', text: '我参加有老师参与的亲子活动。' },
          { id: 'fiq_10', text: '我和老师共同商讨、策划课堂活动。' },
          { id: 'fiq_11', text: '我陪同孩子参加班级集体外出活动。' },
          { id: 'fiq_12', text: '我和其他家长谈孩子学校的会议和事件。' },
          { id: 'fiq_13', text: '我参加我孩子学校举办的家长研讨会或培训讲座。' },
          { id: 'fiq_14', text: '我为我的孩子准备参加学校的集体外出活动。' },
          { id: 'fiq_15', text: '我跟我孩子学校的老师谈论我的培训或职业发展机会。' },
          { id: 'fiq_16', text: '我了解到老师们告诉我孩子他们多么爱学习。' },
          { id: 'fiq_17', text: '我参加我孩子学校里的公益活动。' },
          { id: 'fiq_18', text: '我觉得我孩子班级里的家长们彼此互相支持。' },
          { id: 'fiq_19', text: '我跟我孩子班上的其他家长在校园外见面。' },
        ]
      },
      {
        id: 'comm',
        title: '家园沟通',
        color: '#22C55E',
        questions: [
          { id: 'fiq_20', text: '我带孩子到社区学习专门的知识（如：动物园,图书馆)。' },
          { id: 'fiq_21', text: '我在家制定明确的孩子必须遵守的规则。' },
          { id: 'fiq_22', text: '我在亲友面前谈论孩子在学习上做出的努力。' },
          { id: 'fiq_23', text: '我检查孩子的学校功课。' },
          { id: 'fiq_24', text: '我要求孩子保持一个比较规律的起床和睡觉时间。' },
          { id: 'fiq_25', text: '我在老师面前表扬孩子的学校表现。' },
          { id: 'fiq_26', text: '我和孩子老师谈论孩子与班级其他同学相处的情况。' },
          { id: 'fiq_27', text: '我跟孩子老师谈论班级里的纪律。' },
          { id: 'fiq_28', text: '我跟孩子老师谈论孩子在学校碰到的困难。' },
          { id: 'fiq_29', text: '我和孩子老师谈论需要在家里练习的学校活动。' },
          { id: 'fiq_30', text: '我和我孩子的老师谈论孩子取得的成绩。我与孩子的老师谈论课堂规则。' },
          { id: 'fiq_31', text: '我和孩子老师交流孩子每天在幼儿园的情况。' },
          { id: 'fiq_32', text: '我参加家长会和老师谈论孩子的学习或行为表现。' },
          { id: 'fiq_33', text: '老师和我相互写一些孩子学校活动的留言条子（如：微信,家园联系手册)。' },
          { id: 'fiq_34', text: '我和老师或园长见面谈论相关问题或获得相关信息。' },
          { id: 'fiq_35', text: '我给孩子的老师打电话沟通孩子的情况。' },
          { id: 'fiq_36', text: '我跟老师谈论个人或家庭事情。' },
        ]
      }
    ],
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: ['很少', '有时', '经常', '总是']
  },

  // ── Module B2: Teacher-Child Relationship ──
  teacherChild: {
    teacherName: {
      id: 'tc_teacher_name',
      text: '您孩子的班级教师姓名（或称呼）是：（如果不知道，也可以填不知道）',
      type: 'text',
      placeholder: '请填写教师姓名或称呼'
    },
    groups: [
      {
        id: 'tc_g1',
        title: '自九月以来，您与孩子的班级教师见面或谈论以下内容的频率是？',
        scale: ['从未', '很少', '有时', '经常'],
        items: [
          { id: 'tc_01', text: '与教师谈论您对孩子设定的目标', reverse: false },
          { id: 'tc_02', text: '与教师谈论您对孩子在各个发展阶段的期望', reverse: false },
          { id: 'tc_03', text: '与教师谈论您对孩子未来的愿景', reverse: false },
          { id: 'tc_04', text: '与教师谈论您对您孩子所接受教育和照护的感受', reverse: false }
        ]
      },
      {
        id: 'tc_g2',
        title: '在与班级教师分享以下信息时，您的舒适程度为：',
        scale: ['非常不舒适', '不舒适', '舒适', '非常舒适'],
        items: [
          { id: 'tc_05', text: '与教师分享您的家庭生活', reverse: false },
          { id: 'tc_06', text: '与教师分享信仰和宗教在您家庭中起到的作用', reverse: false },
          { id: 'tc_07', text: '与教师分享您家庭正在发生的变化', reverse: false }
        ]
      },
      {
        id: 'tc_g3',
        title: '您孩子的班级教师完成以下事项的频率是？',
        scale: ['从未', '很少', '有时', '经常'],
        items: [
          { id: 'tc_08', text: '向您提供育儿书籍和材料', reverse: false },
          { id: 'tc_09', text: '询问您希望教师传达给您孩子的文化价值观和信念', reverse: false },
          { id: 'tc_10', text: '问候您的家庭', reverse: false },
          { id: 'tc_11', text: '给您提供机会让您对教师的表现提出反馈', reverse: false },
          { id: 'tc_12', text: '在与您交谈时记得有关您家庭的细节', reverse: false }
        ]
      },
      {
        id: 'tc_g4',
        title: '您孩子的班级教师在多大程度上符合以下说法：',
        scale: ['完全不符合', '有一点像', '非常像', '完全符合'],
        items: [
          { id: 'tc_13', text: '教师根据我的反馈调整对我孩子的教育和照护的方式', reverse: false },
          { id: 'tc_14', text: '教师在活动中体现儿童文化多样性', reverse: false },
          { id: 'tc_15', text: '教师传达我希望孩子具备的文化价值观和信念', reverse: false },
          { id: 'tc_16', text: '教师问我问题来表示对我的家庭的关心', reverse: false }
        ]
      },
      {
        id: 'tc_g5',
        title: '请指出下列词语在多大程度上符合您孩子的班级教师。我孩子的班级教师是……',
        scale: ['完全不符合', '有一点像', '非常像', '完全符合'],
        items: [
          { id: 'tc_17', text: '关心孩子的', reverse: false },
          { id: 'tc_18', text: '粗鲁的', reverse: true },
          { id: 'tc_19', text: '可靠的', reverse: false },
          { id: 'tc_20', text: '没有耐心的', reverse: true },
          { id: 'tc_21', text: '评头论足的', reverse: true },
          { id: 'tc_22', text: '随时可联系的', reverse: false }
        ]
      },
      {
        id: 'tc_g6',
        title: '你在多大程度上同意或不同意以下陈述？',
        scale: ['非常不同意', '不同意', '同意', '非常同意'],
        items: [
          { id: 'tc_23', text: '我孩子的班级教师根据我们的信仰和宗教来评判我们的家庭', reverse: true },
          { id: 'tc_24', text: '我孩子的班级教师根据我们的文化和价值观来评判我们的家庭', reverse: true },
          { id: 'tc_25', text: '我孩子的班级教师根据我们的经济财务状况来评判我们的家庭', reverse: true }
        ]
      }
    ]
  },

  // ── Module C: CCNES (Emotional Guidance) ──
  // 12 scenarios × 6 responses, 1-5 Likert
  ccnes: {
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: ['完全不符合', '比较不符合', '不确定/一般', '比较符合', '完全符合'],
    scenarios: [
      {
        id: 'c1',
        description: '孩子因生病不能去吃宴席,也不能到朋友家玩,他/她非常生气,我会：',
        responses: [
          { id: 'c1_1', text: '把孩子送到房间冷静一下', strategy: 'PUN' },
          { id: 'c1_2', text: '对孩子非常生气', strategy: 'DIS' },
          { id: 'c1_3', text: '帮助孩子想其他可以和朋友在一起的方式（例如，邀请朋友来家里玩）', strategy: 'PF' },
          { id: 'c1_4', text: '告诉孩子没有必要反应太强烈，不能和朋友去玩，这是个小事', strategy: 'MIN' },
          { id: 'c1_5', text: '让孩子说出生气和不舒服的感觉，我在旁边听着', strategy: 'EE' },
          { id: 'c1_6', text: '安慰孩子，和他/她一起做些好玩的事情，让他忘了这个伤心事', strategy: 'EF' }
        ]
      },
      {
        id: 'c2',
        description: '如果我的孩子从他/她的玩具车上摔下来。玩具车坏了，所以他/她很伤心，我：',
        responses: [
          { id: 'c2_1', text: '因为这个意外，我自己也感到很心慌或焦虑', strategy: 'DIS' },
          { id: 'c2_2', text: '安慰我的孩子，让他/她忘记这个伤心的事', strategy: 'EF' },
          { id: 'c2_3', text: '告诉他/她回应太强烈了，车坏了就坏了，不用哭得这么伤心', strategy: 'MIN' },
          { id: 'c2_4', text: '帮我的孩子弄清楚如何修理玩具车', strategy: 'PF' },
          { id: 'c2_5', text: '告诉我的孩子可以哭一会儿', strategy: 'EE' },
          { id: 'c2_6', text: '告诉我的孩子不要哭了，不然就不要再骑玩具车了', strategy: 'PUN' }
        ]
      },
      {
        id: 'c3',
        description: '如果我的孩子在哭，是因为不小心把奖品弄丢了，我：',
        responses: [
          { id: 'c3_1', text: '因为他/她自己不小心弄掉了奖品，还哭，所以生他的气', strategy: 'DIS' },
          { id: 'c3_2', text: '告诉孩子不用回应这么强烈，掉了奖品只是一个小事，不用哭得这么伤心', strategy: 'MIN' },
          { id: 'c3_3', text: '问孩子找了哪些地方，看哪里可以找到', strategy: 'PF' },
          { id: 'c3_4', text: '谈论其他快乐的事情来分散孩子的注意力', strategy: 'EF' },
          { id: 'c3_5', text: '告诉他/她可以哭一会儿', strategy: 'EE' },
          { id: 'c3_6', text: '告诉他/她不要哭了，这点东西都保管不好，再哭就回家', strategy: 'PUN' }
        ]
      },
      {
        id: 'c4',
        description: '如果我的孩子害怕打针，在等待轮到他打针的时候，他会变得很不舒服和流泪，我：',
        responses: [
          { id: 'c4_1', text: '告诉他/她不要再哭了，不然就不能出去玩或者看电视', strategy: 'PUN' },
          { id: 'c4_2', text: '让孩子说说他心里现在的感受', strategy: 'EE' },
          { id: 'c4_3', text: '告诉他/她回应太强烈了，打针是个小事', strategy: 'MIN' },
          { id: 'c4_4', text: '告诉他/她打针哭是丢脸的', strategy: 'DIS' },
          { id: 'c4_5', text: '打针前后都安慰他/她，比如抱抱亲亲他/她', strategy: 'EF' },
          { id: 'c4_6', text: '谈谈有什么办法可以让孩子打针感觉好点（例如，放松，这样就不会疼，或者深呼吸）', strategy: 'PF' }
        ]
      },
      {
        id: 'c5',
        description: '如果我的孩子要我陪他/她去新朋友家玩，但是我没法陪他/她一起去，他/她感到不舒服和紧张，我：',
        responses: [
          { id: 'c5_1', text: '分散我的孩子注意力，告诉他/她朋友那里很多好玩的玩具', strategy: 'EF' },
          { id: 'c5_2', text: '帮助我的孩子想一些他/她到朋友那里可以做的事情。没有我在，朋友家并不可怕（例如，带上他最喜欢的书或玩具）', strategy: 'PF' },
          { id: 'c5_3', text: '告诉我的孩子这事他/她想得太严重了，这个事情没有什么值得紧张不安的', strategy: 'MIN' },
          { id: 'c5_4', text: '告诉孩子，如果他/她再闹别扭，他/她不能再出去了', strategy: 'PUN' },
          { id: 'c5_5', text: '因为孩子的回应，自己感到烦躁', strategy: 'DIS' },
          { id: 'c5_6', text: '鼓励我的孩子给我谈谈他/她的紧张情绪', strategy: 'EE' }
        ]
      },
      {
        id: 'c6',
        description: '如果我的孩子正和他/她的朋友一起参加一些幼儿园的班级活动，然后犯一个错误，看上去很尴尬，他/她快要哭了，我：',
        responses: [
          { id: 'c6_1', text: '安慰我的孩子，让他/她感觉好点儿', strategy: 'EF' },
          { id: 'c6_2', text: '告诉他/她没有必要，他/她的回应太强烈了，这个事情是个小事', strategy: 'MIN' },
          { id: 'c6_3', text: '我自己感到难受和尴尬', strategy: 'DIS' },
          { id: 'c6_4', text: '告诉我的孩子不能哭，否则我们就直接回家', strategy: 'PUN' },
          { id: 'c6_5', text: '鼓励我的孩子谈谈他/她的尴尬感受', strategy: 'EE' },
          { id: 'c6_6', text: '告诉我的孩子我帮助他/她练习，这样他/她下次可以做得更好', strategy: 'PF' }
        ]
      },
      {
        id: 'c7',
        description: '如果我的孩子马上要表演节目了，并他/她感到明显的紧张，我：',
        responses: [
          { id: 'c7_1', text: '帮助我的孩子思考他/她在上台前能做的事情（例如，做一些热身，而不是看观众）', strategy: 'PF' },
          { id: 'c7_2', text: '和我的孩子想一些放松的事情，让他/她不会紧张', strategy: 'EF' },
          { id: 'c7_3', text: '我会因为孩子情况而焦虑', strategy: 'DIS' },
          { id: 'c7_4', text: '告诉他/她，没有必要因为这个事情反应强烈，这个事情是个小事', strategy: 'MIN' },
          { id: 'c7_5', text: '告诉我的孩子，如果他/她不冷静下来，我们必须马上离开回家', strategy: 'PUN' },
          { id: 'c7_6', text: '鼓励我的孩子谈论他/她的紧张情绪', strategy: 'EE' }
        ]
      },
      {
        id: 'c8',
        description: '如果我的孩子从朋友那里收到一份不心仪的生日礼物，在朋友面前打开礼物后，明显感到失望和生气，我：',
        responses: [
          { id: 'c8_1', text: '鼓励我的孩子表达他/她失望的感觉', strategy: 'EE' },
          { id: 'c8_2', text: '告诉我的孩子礼物可以和想要这个礼物的孩子交换', strategy: 'PF' },
          { id: 'c8_3', text: '因为孩子脾气暴躁而生他/她的气', strategy: 'DIS' },
          { id: 'c8_4', text: '告诉我的孩子这个事情是个小事，没有必要回应这么强烈', strategy: 'MIN' },
          { id: 'c8_5', text: '责备我的孩子没有照顾到朋友的感情，在朋友面前不懂事', strategy: 'PUN' },
          { id: 'c8_6', text: '试着通过做些有趣的事情让我的孩子感觉不那么难受', strategy: 'EF' }
        ]
      },
      {
        id: 'c9',
        description: '如果我的孩子在看了一档恐怖的电视节目后惊慌失措，睡不着觉，我：',
        responses: [
          { id: 'c9_1', text: '鼓励我的孩子谈论他/她害怕的事情', strategy: 'EE' },
          { id: 'c9_2', text: '觉得他/她这样胆小，并因此生他/她的气', strategy: 'DIS' },
          { id: 'c9_3', text: '告诉我的孩子恐怖片没什么，是个小事，没什么大不了的', strategy: 'MIN' },
          { id: 'c9_4', text: '帮助我的孩子想些可以让他/她睡觉的办法（例如，开灯睡觉）', strategy: 'PF' },
          { id: 'c9_5', text: '告诉他/她再不睡，以后就不要看电视', strategy: 'PUN' },
          { id: 'c9_6', text: '和我的孩子一起做点有趣的事，帮助他/她忘记是什么吓到了他', strategy: 'EF' }
        ]
      },
      {
        id: 'c10',
        description: '如果我的孩子在外面玩，看起来很难受。因为其他孩子对他/她不好，不愿和他/她玩，我：',
        responses: [
          { id: 'c10_1', text: '我感到不高兴，烦躁', strategy: 'DIS' },
          { id: 'c10_2', text: '告诉我的孩子如果再哭，我们就马上回家，不要玩了', strategy: 'PUN' },
          { id: 'c10_3', text: '告诉我的孩子，当他/她感觉不好的时候哭是可以的', strategy: 'EE' },
          { id: 'c10_4', text: '安慰孩子，让他/她想一些快乐的事情', strategy: 'EF' },
          { id: 'c10_5', text: '带孩子离开，或者和孩子一起想办法加入游戏', strategy: 'PF' },
          { id: 'c10_6', text: '告诉我的孩子，这个是个小事，没有必要这么伤心', strategy: 'MIN' }
        ]
      },
      {
        id: 'c11',
        description: '如果我的孩子和其他孩子玩耍，有人取笑他/她，我的孩子流泪，我：',
        responses: [
          { id: 'c11_1', text: '告诉我的孩子没有必要因为这个回应如此强烈，没什么大不了', strategy: 'MIN' },
          { id: 'c11_2', text: '我因为孩子的反应感到不舒服', strategy: 'DIS' },
          { id: 'c11_3', text: '告诉我的孩子注意自己行为，否则我们就得马上回家', strategy: 'PUN' },
          { id: 'c11_4', text: '帮助我的孩子想办法，当其他孩子戏弄他/她的时候（例如，找其他事情做）', strategy: 'PF' },
          { id: 'c11_5', text: '安慰他/她，跟他/她玩游戏，让他/她忘了这个事', strategy: 'EF' },
          { id: 'c11_6', text: '鼓励他/她说出被取笑的感受', strategy: 'EE' }
        ]
      },
      {
        id: 'c12',
        description: '如果我有个非常害羞的孩子，他/她在陌生人面前感到害怕。每当我朋友来看我时，或者我们去看我朋友时，他/她都不想去，我：',
        responses: [
          { id: 'c12_1', text: '帮助我的孩子想一些办法，让和我的朋友见面不那么可怕，比如（见我朋友时，让他/她带着最喜欢的玩具去玩）', strategy: 'PF' },
          { id: 'c12_2', text: '告诉我的孩子，可以紧张，可以选择呆在自己房间', strategy: 'EE' },
          { id: 'c12_3', text: '给他/她讲讲和我的朋友一起玩会有多有趣，试图让他/她开心', strategy: 'EF' },
          { id: 'c12_4', text: '因为孩子的这种行为，我心里难受', strategy: 'DIS' },
          { id: 'c12_5', text: '告诉他/她必须呆在客厅里，到客厅来接待客人，或者必须跟我去朋友家', strategy: 'PUN' },
          { id: 'c12_6', text: '告诉他/她，他/她回应太强烈了，像婴儿一样', strategy: 'MIN' }
        ]
      }
    ]
  }
};

// ── Step Definitions ──
const STEPS = [
  { id: 'welcome', label: '欢迎', progress: 0 },
  { id: 'step1', label: '背景信息', progress: 20 },
  { id: 'step2', label: '家庭参与', progress: 40 },
  { id: 'step3', label: '家园关系', progress: 60 },
  { id: 'step4', label: '情绪引导', progress: 80 },
  { id: 'results', label: '结果', progress: 100 }
];

import { z } from "zod";
import { BaseTool } from "../tools/base";
import { checkIncompatibilities } from "../safety/incompatibilities";
import { checkFears } from "../safety/fears";
import { PHARMACOPOEIA_DOSE_LIMITS } from "../safety/dose-limits";
import { PREGNANCY_CONTRAINDICATED_HERBS } from "../safety/pregnancy";

/**
 * 中药知识库 MCP Server
 *
 * Uses local hardcoded safety data for herb property lookups.
 */

// Simplified herb properties database
const HERB_PROPERTIES: Record<string, {
  nature: string; flavor: string; meridians: string[];
  effects: string[]; indications: string[];
}> = {
  "人参": { nature: "微温", flavor: "甘、微苦", meridians: ["脾", "肺", "心"], effects: ["大补元气", "补脾益肺", "生津止渴", "安神益智"], indications: ["气虚欲脱", "脾气不足", "肺气亏虚", "津伤口渴"] },
  "黄芪": { nature: "微温", flavor: "甘", meridians: ["脾", "肺"], effects: ["补气升阳", "益卫固表", "利水消肿", "托毒生肌"], indications: ["气虚乏力", "自汗", "水肿", "疮疡不敛"] },
  "白术": { nature: "温", flavor: "甘、苦", meridians: ["脾", "胃"], effects: ["补气健脾", "燥湿利水", "止汗", "安胎"], indications: ["脾气虚弱", "痰饮水肿", "自汗", "胎动不安"] },
  "茯苓": { nature: "平", flavor: "甘、淡", meridians: ["心", "脾", "肾"], effects: ["利水渗湿", "健脾宁心"], indications: ["水肿尿少", "痰饮眩悸", "脾虚食少", "心神不安"] },
  "当归": { nature: "温", flavor: "甘、辛", meridians: ["肝", "心", "脾"], effects: ["补血活血", "调经止痛", "润肠通便"], indications: ["血虚萎黄", "月经不调", "经闭痛经", "肠燥便秘"] },
  "川芎": { nature: "温", flavor: "辛", meridians: ["肝", "胆"], effects: ["活血行气", "祛风止痛"], indications: ["月经不调", "经闭痛经", "头痛", "风湿痹痛"] },
  "白芍": { nature: "微寒", flavor: "苦、酸", meridians: ["肝", "脾"], effects: ["养血调经", "敛阴止汗", "柔肝止痛", "平抑肝阳"], indications: ["血虚萎黄", "月经不调", "自汗盗汗", "胁痛腹痛"] },
  "熟地黄": { nature: "微温", flavor: "甘", meridians: ["肝", "肾"], effects: ["补血滋阴", "益精填髓"], indications: ["血虚萎黄", "心悸怔忡", "月经不调", "肝肾阴虚"] },
  "黄连": { nature: "寒", flavor: "苦", meridians: ["心", "脾", "胃", "肝", "胆"], effects: ["清热燥湿", "泻火解毒"], indications: ["湿热痞满", "呕吐吞酸", "泻痢", "高热神昏"] },
  "黄芩": { nature: "寒", flavor: "苦", meridians: ["肺", "胆", "脾", "大肠"], effects: ["清热燥湿", "泻火解毒", "止血", "安胎"], indications: ["湿温暑湿", "胸闷呕恶", "肺热咳嗽", "血热出血"] },
  "附子": { nature: "热", flavor: "辛、甘", meridians: ["心", "肾", "脾"], effects: ["回阳救逆", "补火助阳", "散寒止痛"], indications: ["亡阳证", "阳虚证", "寒痹疼痛"] },
  "干姜": { nature: "热", flavor: "辛", meridians: ["脾", "胃", "肾", "心", "肺"], effects: ["温中散寒", "回阳通脉", "温肺化饮"], indications: ["腹痛呕吐", "亡阳证", "寒饮喘咳"] },
  "半夏": { nature: "温", flavor: "辛", meridians: ["脾", "胃", "肺"], effects: ["燥湿化痰", "降逆止呕", "消痞散结"], indications: ["痰多咳喘", "呕吐反胃", "胸脘痞闷"] },
  "陈皮": { nature: "温", flavor: "辛、苦", meridians: ["脾", "肺"], effects: ["理气健脾", "燥湿化痰"], indications: ["脘腹胀满", "食少吐泻", "咳嗽痰多"] },
  "甘草": { nature: "平", flavor: "甘", meridians: ["心", "肺", "脾", "胃"], effects: ["补脾益气", "清热解毒", "祛痰止咳", "缓急止痛", "调和诸药"], indications: ["脾胃虚弱", "倦怠乏力", "咳嗽痰多", "脘腹四肢挛急疼痛"] },
  "麻黄": { nature: "温", flavor: "辛、微苦", meridians: ["肺", "膀胱"], effects: ["发汗散寒", "宣肺平喘", "利水消肿"], indications: ["风寒感冒", "胸闷喘咳", "风水水肿"] },
  "桂枝": { nature: "温", flavor: "辛、甘", meridians: ["心", "肺", "膀胱"], effects: ["发汗解肌", "温通经脉", "助阳化气"], indications: ["风寒感冒", "寒湿痹痛", "痰饮蓄水"] },
  "柴胡": { nature: "微寒", flavor: "苦、辛", meridians: ["肝", "胆"], effects: ["和解表里", "疏肝升阳"], indications: ["感冒发热", "寒热往来", "胸胁胀痛", "月经不调"] },
  "酸枣仁": { nature: "平", flavor: "甘、酸", meridians: ["心", "肝"], effects: ["养心补肝", "宁心安神", "敛汗", "生津"], indications: ["虚烦不眠", "惊悸多梦", "体虚多汗", "津伤口渴"] },
};

const searchHerbInputSchema = z.object({
  herbName: z.string(),
  query: z.string().optional(),
});

const searchHerbOutputSchema = z.object({
  name: z.string(),
  pinyin: z.string(),
  nature: z.string(),
  flavor: z.string(),
  meridians: z.array(z.string()),
  effects: z.array(z.string()),
  indications: z.array(z.string()),
  dosage: z.object({
    min: z.number(),
    max: z.number(),
  }).nullable(),
  contraindications: z.array(z.string()),
  interactions: z.array(z.string()),
  processing: z.string().optional(),
  description: z.string(),
});

type SearchHerbInput = z.infer<typeof searchHerbInputSchema>;
type SearchHerbOutput = z.infer<typeof searchHerbOutputSchema>;

export class HerbSearchTool extends BaseTool<SearchHerbInput, SearchHerbOutput> {
  definition = {
    name: "search_herb",
    description: "查询中药性味归经、功效主治、用法用量",
    inputSchema: searchHerbInputSchema,
    outputSchema: searchHerbOutputSchema,
  };

  async execute(input: SearchHerbInput): Promise<SearchHerbOutput> {
    const props = HERB_PROPERTIES[input.herbName];
    const doseLimit = PHARMACOPOEIA_DOSE_LIMITS[input.herbName];
    const isPregnancyContraindicated = PREGNANCY_CONTRAINDICATED_HERBS.includes(input.herbName);

    // Check for incompatibilities with common herbs
    const incompatPairs = checkIncompatibilities([input.herbName]);
    const fearPairs = checkFears([input.herbName]);

    const contraindications: string[] = [];
    if (isPregnancyContraindicated) contraindications.push("孕妇禁用");

    const interactions: string[] = [];
    for (const [a, b] of incompatPairs) {
      interactions.push(`十八反：与${a === input.herbName ? b : a}不可同用`);
    }
    for (const [a, b] of fearPairs) {
      interactions.push(`十九畏：与${a === input.herbName ? b : a}不宜同用`);
    }

    const description = props
      ? `${input.herbName}，${props.nature}，味${props.flavor}，归${props.meridians.join("、")}经。${props.effects.join("，")}。`
      : `${input.herbName}：暂无详细属性数据。`;

    return {
      name: input.herbName,
      pinyin: "",
      nature: props?.nature ?? "未知",
      flavor: props?.flavor ?? "未知",
      meridians: props?.meridians ?? [],
      effects: props?.effects ?? [],
      indications: props?.indications ?? [],
      dosage: doseLimit ? { min: doseLimit[0], max: doseLimit[1] } : null,
      contraindications,
      interactions,
      description,
    };
  }
}

const getHerbPropertiesInputSchema = z.object({
  herbNames: z.array(z.string()),
});

const getHerbPropertiesOutputSchema = z.object({
  herbs: z.array(z.object({
    name: z.string(),
    nature: z.string(),
    flavor: z.string(),
    meridians: z.array(z.string()),
  })),
  compatibility: z.object({
    hasIncompatibility: z.boolean(),
    hasFear: z.boolean(),
    warnings: z.array(z.string()),
  }),
});

type GetHerbPropertiesInput = z.infer<typeof getHerbPropertiesInputSchema>;
type GetHerbPropertiesOutput = z.infer<typeof getHerbPropertiesOutputSchema>;

export class HerbPropertiesTool extends BaseTool<GetHerbPropertiesInput, GetHerbPropertiesOutput> {
  definition = {
    name: "get_herb_properties",
    description: "批量查询中药属性和配伍禁忌",
    inputSchema: getHerbPropertiesInputSchema,
    outputSchema: getHerbPropertiesOutputSchema,
  };

  async execute(input: GetHerbPropertiesInput): Promise<GetHerbPropertiesOutput> {
    const incompatViolations = checkIncompatibilities(input.herbNames);
    const fearViolations = checkFears(input.herbNames);

    const warnings: string[] = [];
    for (const [a, b] of incompatViolations) {
      warnings.push(`十八反：${a}与${b}不可同用`);
    }
    for (const [a, b] of fearViolations) {
      warnings.push(`十九畏：${a}与${b}不宜同用`);
    }

    return {
      herbs: input.herbNames.map(name => {
        const props = HERB_PROPERTIES[name];
        return {
          name,
          nature: props?.nature ?? "未知",
          flavor: props?.flavor ?? "未知",
          meridians: props?.meridians ?? [],
        };
      }),
      compatibility: {
        hasIncompatibility: incompatViolations.length > 0,
        hasFear: fearViolations.length > 0,
        warnings,
      },
    };
  }
}

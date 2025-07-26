import { Resource } from "sst";
import { Example } from "@payflow/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);

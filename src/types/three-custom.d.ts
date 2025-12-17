import { Object3DNode } from "@react-three/fiber";
import { LoaderShaderMaterial } from "../components/shaders/LoaderShaderMaterial";

declare module "@react-three/fiber" {
  interface ThreeElements {
    loaderShaderMaterial: Object3DNode<InstanceType<typeof LoaderShaderMaterial>, typeof LoaderShaderMaterial>;
  }
}

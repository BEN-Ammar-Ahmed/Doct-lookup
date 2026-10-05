import Image from "next/image";

export default function Brand() {
  return <><Image className="brand-mark" src="/brand/insurebased-mark.svg" alt="" width={40} height={40} /><span className="brand-wordmark">InsureBased</span></>;
}

import React from "react";
import cn from "../../utils/cn";

const Logo = ({ className }) => {
  return (
    <svg
      viewBox="0 0 128 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        className,
        "fill-none"
      )}
    >
      <path
        d="M8.10869 1.89906C11.33 1.89906 13.8014 2.72756 15.5231 4.38458C17.2449 6.0416 18.1057 8.34095 18.1057 11.2826C18.1057 14.5967 16.9672 17.1287 14.6901 18.8788C13.8385 19.5491 12.8758 20.0145 11.802 20.2752C10.7283 20.5172 9.49717 20.6383 8.10869 20.6383H0V19.2698L1.69394 19.1302L2.13825 18.6833V3.85396L1.69394 3.40713L0 3.26749V1.89906H8.10869ZM5.80382 3.46298V19.0743H7.41445C11.7835 19.0743 13.9681 16.4678 13.9681 11.2547C13.9681 6.06022 11.7835 3.46298 7.41445 3.46298H5.80382Z"
        fill="#0D6EFD"
      />
      <path
        d="M23.5713 0.418909C24.2007 0.418909 24.7006 0.6144 25.0709 1.00538C25.4596 1.39636 25.654 1.88044 25.654 2.4576C25.654 3.09062 25.4596 3.60262 25.0709 3.9936C24.6821 4.38458 24.1915 4.58007 23.5991 4.58007C23.0437 4.58007 22.5623 4.39389 22.1551 4.02153C21.7663 3.63054 21.5719 3.12785 21.5719 2.51345C21.5719 1.91767 21.757 1.42429 22.1273 1.03331C22.5161 0.623709 22.9974 0.418909 23.5713 0.418909ZM23.8768 6.78633H25.2097V18.8509L25.6262 19.2698L27.1813 19.3815V20.6383H19.9057V19.3815L21.4053 19.2698L21.7941 18.8509V9.216H19.9613V8.09891L23.8768 6.78633Z"
        fill="#0D6EFD"
      />
      <path
        d="M38.5026 7.3728V11.0871H36.8364L36.5588 8.99258L36.2255 8.68538C35.9293 8.53644 35.6238 8.42473 35.3091 8.35025C35.0129 8.27578 34.7075 8.23855 34.3927 8.23855C33.7077 8.23855 33.1801 8.38749 32.8099 8.68538C32.4581 8.98327 32.2822 9.39287 32.2822 9.91418C32.2822 10.4913 32.5044 10.9475 32.9487 11.2826C33.4115 11.5991 34.0502 11.9622 34.8648 12.3718C35.6979 12.7628 36.4106 13.1351 37.0031 13.4889C37.614 13.8426 38.0861 14.2429 38.4193 14.6897C38.7525 15.118 38.9192 15.6672 38.9192 16.3375C38.9192 17.7524 38.4193 18.8788 37.4196 19.7167C36.4384 20.5359 35.0499 20.9455 33.2542 20.9455C31.8842 20.9455 30.3569 20.7127 28.6722 20.2473V16.114H30.3662L30.6716 18.5158L30.9493 18.823C31.6713 19.214 32.4489 19.4095 33.282 19.4095C34.041 19.4095 34.6241 19.2326 35.0314 18.8788C35.4387 18.5065 35.6424 18.0131 35.6424 17.3987C35.6424 16.896 35.485 16.505 35.1703 16.2257C34.8556 15.9279 34.4205 15.6579 33.8651 15.4159C33.3282 15.1738 32.6988 14.8759 31.9768 14.5222C30.9586 14.0009 30.181 13.4703 29.6441 12.9303C29.1258 12.3718 28.8666 11.6736 28.8666 10.8358C28.8666 9.6256 29.3479 8.62953 30.3106 7.84756C31.2733 7.0656 32.6062 6.67462 34.3094 6.67462C35.7164 6.67462 37.1141 6.90735 38.5026 7.3728Z"
        fill="#0D6EFD"
      />
      <path
        d="M42.2866 9.07636H40.4816V8.01513L42.5366 6.84218L43.9806 3.93774H45.7301V7.40073H49.8399V9.07636H45.7301V16.0303C45.7301 17.017 45.8874 17.7152 46.2021 18.1248C46.5169 18.5344 47.1278 18.7392 48.0349 18.7392C48.7199 18.7392 49.3216 18.674 49.8399 18.5437V19.8842C49.0069 20.1821 48.2293 20.4055 47.5073 20.5545C46.8038 20.7034 46.1651 20.7779 45.5912 20.7779C45.1284 20.7779 44.7026 20.7313 44.3138 20.6383C43.9436 20.5452 43.6011 20.3869 43.2863 20.1635C42.805 19.847 42.5181 19.456 42.4255 18.9905C42.3329 18.5065 42.2866 17.9107 42.2866 17.2032V9.07636Z"
        fill="#0D6EFD"
      />
      <path
        d="M50.7396 20.6383V19.3815L52.2114 19.2698L52.6002 18.8509V9.216H50.6008V8.09891L54.6829 6.78633H56.0158L55.9048 9.63491C56.4046 9.09498 56.923 8.59229 57.4598 8.12684C58.0152 7.64276 58.5799 7.19593 59.1538 6.78633C59.2464 6.76771 59.3482 6.7584 59.4593 6.7584C59.5703 6.73978 59.6721 6.73047 59.7647 6.73047C60.3571 6.73047 60.9681 6.88873 61.5975 7.20524L61.2365 11.0592H59.7925C59.3852 10.3889 58.7835 10.0538 57.9875 10.0538C57.5246 10.0538 56.8674 10.3145 56.0158 10.8358V18.8509L56.4324 19.2698L58.404 19.3815V20.6383H50.7396Z"
        fill="#0D6EFD"
      />
      <path
        d="M66.0933 0.418909C66.7228 0.418909 67.2226 0.6144 67.5929 1.00538C67.9817 1.39636 68.176 1.88044 68.176 2.4576C68.176 3.09062 67.9817 3.60262 67.5929 3.9936C67.2041 4.38458 66.7135 4.58007 66.1211 4.58007C65.5657 4.58007 65.0844 4.39389 64.6771 4.02153C64.2883 3.63054 64.0939 3.12785 64.0939 2.51345C64.0939 1.91767 64.2791 1.42429 64.6493 1.03331C65.0381 0.623709 65.5194 0.418909 66.0933 0.418909ZM66.3988 6.78633H67.7317V18.8509L68.1483 19.2698L69.7034 19.3815V20.6383H62.4278V19.3815L63.9273 19.2698L64.3161 18.8509V9.216H62.4833V8.09891L66.3988 6.78633Z"
        fill="#0D6EFD"
      />
      <path
        d="M74.4433 0H75.7762V7.9872C77.2758 7.14938 78.618 6.73047 79.8028 6.73047C80.858 6.73047 81.7929 7.00044 82.6075 7.54036C83.4406 8.06167 84.0885 8.79709 84.5514 9.74662C85.0327 10.6961 85.2734 11.8039 85.2734 13.07C85.2734 14.6897 84.8939 16.0861 84.1348 17.2591C83.3943 18.432 82.3113 19.3443 80.8858 19.9959C79.8676 20.4428 78.294 20.6662 76.165 20.6662C76.0354 20.6662 75.9058 20.6662 75.7762 20.6662C75.6651 20.6662 75.5448 20.6662 75.4152 20.6662L72.3328 20.6103V2.40174H70.3334V1.31258L74.4433 0ZM75.7762 19.1302C75.9243 19.1488 76.0724 19.1581 76.2205 19.1581C76.3871 19.1581 76.5352 19.1581 76.6648 19.1581C78.3495 19.1581 79.5806 18.7206 80.3582 17.8455C81.1542 16.9705 81.5523 15.6207 81.5523 13.7961C81.5523 12.1949 81.2005 10.9847 80.497 10.1655C79.7935 9.32771 78.8031 8.9088 77.5257 8.9088C77.285 8.9088 77.0166 8.92742 76.7204 8.96465C76.4242 9.00189 76.1094 9.05774 75.7762 9.13222V19.1302Z"
        fill="#0D6EFD"
      />
      <path
        d="M90.637 6.70255H91.9699V15.36C91.9699 16.4399 92.1643 17.2311 92.5531 17.7338C92.9604 18.2365 93.6454 18.4879 94.608 18.4879C94.9598 18.4879 95.3301 18.4506 95.7188 18.3761C96.1076 18.2831 96.5334 18.1713 96.9962 18.041V9.13222H95.1912V8.04305L99.1345 6.70255H100.412V18.8509L100.801 19.2698L102.245 19.3815V20.6383H96.9962V19.1023C96.1261 19.6794 95.3115 20.1263 94.5525 20.4428C93.812 20.7407 93.0715 20.8896 92.3309 20.8896C89.7947 20.8896 88.5265 19.2977 88.5265 16.114V9.13222H86.7215V8.04305L90.637 6.70255Z"
        fill="#0D6EFD"
      />
      <path
        d="M105.066 9.07636H103.261V8.01513L105.316 6.84218L106.76 3.93774H108.51V7.40073H112.62V9.07636H108.51V16.0303C108.51 17.017 108.667 17.7152 108.982 18.1248C109.297 18.5344 109.907 18.7392 110.815 18.7392C111.5 18.7392 112.101 18.674 112.62 18.5437V19.8842C111.787 20.1821 111.009 20.4055 110.287 20.5545C109.583 20.7034 108.945 20.7779 108.371 20.7779C107.908 20.7779 107.482 20.7313 107.093 20.6383C106.723 20.5452 106.381 20.3869 106.066 20.1635C105.585 19.847 105.298 19.456 105.205 18.9905C105.113 18.5065 105.066 17.9107 105.066 17.2032V9.07636Z"
        fill="#0D6EFD"
      />
      <path
        d="M122.239 19.0464C121.35 19.6422 120.517 20.0983 119.74 20.4148C118.981 20.7313 118.222 20.8896 117.463 20.8896C116.389 20.8896 115.509 20.5545 114.824 19.8842C114.158 19.1953 113.825 18.3203 113.825 17.2591C113.825 16.1792 114.121 15.3321 114.713 14.7177C115.324 14.1033 116.25 13.5913 117.49 13.1817C118.731 12.7721 120.323 12.3532 122.267 11.9249V11.0871C122.267 10.0817 122.054 9.34633 121.628 8.88087C121.221 8.41542 120.554 8.18269 119.629 8.18269C119.24 8.18269 118.795 8.23855 118.296 8.35025V10.9754H115.741C115.334 10.9754 115.019 10.9009 114.797 10.752C114.575 10.5844 114.463 10.3145 114.463 9.94211C114.463 9.40218 114.713 8.89018 115.213 8.40611C115.713 7.90342 116.417 7.49382 117.324 7.17731C118.231 6.8608 119.295 6.70255 120.517 6.70255C121.813 6.70255 122.841 6.87011 123.6 7.20524C124.359 7.52174 124.896 8.04305 125.21 8.76916C125.543 9.49527 125.71 10.4541 125.71 11.6457V18.8788L126.071 19.2698L127.543 19.4095V20.6383H122.6L122.239 19.0464ZM122.239 17.9014V13.3492C120.61 13.703 119.406 14.1126 118.629 14.578C117.87 15.0249 117.49 15.7137 117.49 16.6447C117.49 17.2777 117.675 17.7897 118.046 18.1807C118.416 18.553 118.916 18.7392 119.545 18.7392C120.267 18.7392 121.165 18.4599 122.239 17.9014Z"
        fill="#0D6EFD"
      />
      <path d="M0 23.2727H127.277" stroke="#111111" />
      <path
        d="M23.5723 0.419034C24.2017 0.419034 24.7016 0.614525 25.0718 1.00551C25.4606 1.39649 25.655 1.88056 25.655 2.45773C25.655 3.09074 25.4606 3.60274 25.0718 3.99373C24.6831 4.38471 24.1925 4.5802 23.6001 4.5802C23.0447 4.5802 22.5633 4.39402 22.156 4.02165C21.7673 3.63067 21.5729 3.12798 21.5729 2.51358C21.5729 1.9178 21.758 1.42442 22.1283 1.03343C22.517 0.623834 22.9984 0.419034 23.5723 0.419034Z"
        fill="#111111"
      />
      <path
        d="M66.0943 0.419034C66.7238 0.419034 67.2236 0.614525 67.5939 1.00551C67.9826 1.39649 68.177 1.88056 68.177 2.45773C68.177 3.09074 67.9826 3.60274 67.5939 3.99373C67.2051 4.38471 66.7145 4.5802 66.1221 4.5802C65.5667 4.5802 65.0854 4.39402 64.6781 4.02165C64.2893 3.63067 64.0949 3.12798 64.0949 2.51358C64.0949 1.9178 64.28 1.42442 64.6503 1.03343C65.0391 0.623834 65.5204 0.419034 66.0943 0.419034Z"
        fill="#111111"
      />
    </svg>
  );
};

export default Logo;

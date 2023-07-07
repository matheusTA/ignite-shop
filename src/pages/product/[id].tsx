import { stripe } from "@/lib/stripe";
import {
  ImageContainer,
  ProductContainer,
  ProductDetails,
} from "@/styles/pages/product";
import axios from "axios";
import { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import Stripe from "stripe";

interface ProductProps {
  product: {
    id: string;
    title: string;
    imageUrl: string;
    price: string;
    description: string;
    defaultPriceId: string;
  };
}


export default function Product({product}: ProductProps) {
  const [isCreateCheckoutSession, setIsCreateCheckoutSession] = useState(false);
  const {isFallback} = useRouter();

  async function handleBuy() {
    try {
      setIsCreateCheckoutSession(true);
      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId,
      });

      const {checkoutUrl} = response.data;

      window.location.href = checkoutUrl;
    } catch (error) {
      setIsCreateCheckoutSession(false);
      alert('Falha ao redirecionar para o pagamento');
    }
  }

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Head>
        <title>{product.title} | Ignite Shop</title>
      </Head>
      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} width={520} height={480} alt="" />
        </ImageContainer>

        <ProductDetails>
          <h1>{product.title}</h1>
          <span>{product.price}</span>

          <p>{product.description}</p>

          <button disabled={isCreateCheckoutSession} onClick={handleBuy}>Comprar agora</button>
        </ProductDetails>
      </ProductContainer>
    </>
  );
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({
  params,
}) => {
  const productId = params?.id;

  const product = await stripe.products.retrieve(productId, {
    expand: ["default_price"],
  });

  const price = product.default_price as Stripe.Price;

  return {
    props: {
      product: {
        id: product.id,
        title: product.name,
        imageUrl: product.images[0],
        price: new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format((price.unit_amount || 0) / 100),
        description: product.description,
        defaultPriceId: price.id,
      },
    },
    revalidate: 60 * 60 * 1, // 1 hours
  };
};

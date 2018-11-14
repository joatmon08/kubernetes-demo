VERSION=1.0

visualize:
	kubectl proxy --www=. --www-prefix=/visualize/

examples:
	kubectl apply -f examples/